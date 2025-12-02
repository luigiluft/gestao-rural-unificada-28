-- Add origem field to track where the ticket came from
ALTER TABLE public.chamados_suporte 
ADD COLUMN IF NOT EXISTS origem text DEFAULT 'interno',
ADD COLUMN IF NOT EXISTS nome_contato text,
ADD COLUMN IF NOT EXISTS email_contato text,
ADD COLUMN IF NOT EXISTS telefone_contato text,
ADD COLUMN IF NOT EXISTS empresa_contato text;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.chamados_suporte;
DROP POLICY IF EXISTS "Users can create tickets" ON public.chamados_suporte;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.chamados_suporte;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.chamados_suporte;
DROP POLICY IF EXISTS "chamados_suporte_select_consolidated" ON public.chamados_suporte;
DROP POLICY IF EXISTS "chamados_suporte_insert_consolidated" ON public.chamados_suporte;
DROP POLICY IF EXISTS "chamados_suporte_update_consolidated" ON public.chamados_suporte;

-- Enable RLS
ALTER TABLE public.chamados_suporte ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert tickets from public contact form
CREATE POLICY "chamados_suporte_anon_insert" 
ON public.chamados_suporte 
FOR INSERT 
TO anon
WITH CHECK (origem = 'site');

-- Allow authenticated users to insert their own tickets
CREATE POLICY "chamados_suporte_auth_insert" 
ON public.chamados_suporte 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- SELECT policy: 
-- Admin sees all
-- Operador sees tickets from their franchise users (interno origin)
-- Cliente sees only their own tickets
CREATE POLICY "chamados_suporte_select" 
ON public.chamados_suporte 
FOR SELECT 
TO authenticated
USING (
  -- Admin sees all
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR
  -- User sees their own tickets (except site origin which is admin-only)
  (auth.uid() = user_id AND origem != 'site')
  OR
  -- Operador sees tickets from users in their franchises (interno origin only)
  (
    public.get_user_role_direct(auth.uid()) = 'operador'
    AND origem = 'interno'
    AND EXISTS (
      SELECT 1 FROM public.franquia_usuarios fu1
      JOIN public.franquia_usuarios fu2 ON fu1.franquia_id = fu2.franquia_id
      WHERE fu1.user_id = auth.uid()
      AND fu2.user_id = chamados_suporte.user_id
      AND fu1.ativo = true
      AND fu2.ativo = true
    )
  )
);

-- UPDATE policy: Admin and operador can update
CREATE POLICY "chamados_suporte_update" 
ON public.chamados_suporte 
FOR UPDATE 
TO authenticated
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR
  (
    public.get_user_role_direct(auth.uid()) = 'operador'
    AND origem = 'interno'
  )
)
WITH CHECK (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR
  (
    public.get_user_role_direct(auth.uid()) = 'operador'
    AND origem = 'interno'
  )
);