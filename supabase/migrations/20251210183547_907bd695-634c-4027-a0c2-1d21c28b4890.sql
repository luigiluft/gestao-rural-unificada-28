-- Drop existing insert policy
DROP POLICY IF EXISTS "franquias_insert_policy" ON public.franquias;

-- Create new insert policy that allows:
-- 1. Admins to create any deposit
-- 2. Clients to create deposits for their own companies (tipo_deposito = 'filial')
CREATE POLICY "franquias_insert_policy" ON public.franquias
FOR INSERT
WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR (
    -- Clients can create filial deposits (their own matrix/branches)
    check_user_role_safe(auth.uid(), 'cliente'::app_role) 
    AND tipo_deposito = 'filial'
    AND master_franqueado_id IS NULL
  )
  OR (
    -- Operators can create deposits they will manage
    check_user_role_safe(auth.uid(), 'operador'::app_role)
  )
);