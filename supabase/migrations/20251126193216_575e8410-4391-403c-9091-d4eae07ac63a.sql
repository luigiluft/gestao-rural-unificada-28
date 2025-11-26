-- Add transportadora_id to tabelas_frete
ALTER TABLE public.tabelas_frete 
ADD COLUMN IF NOT EXISTS transportadora_id UUID REFERENCES public.transportadoras(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tabelas_frete_transportadora 
ON public.tabelas_frete(transportadora_id);

-- Add comment
COMMENT ON COLUMN public.tabelas_frete.transportadora_id IS 'ID da transportadora terceira. NULL = tabela do próprio operador';

-- Enable RLS on transportadoras if not already enabled
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Operadores podem ver suas transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Operadores podem criar transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Operadores podem atualizar suas transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Operadores podem deletar suas transportadoras" ON public.transportadoras;

-- Create RLS policies for transportadoras
CREATE POLICY "Operadores podem ver suas transportadoras"
ON public.transportadoras FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Operadores podem criar transportadoras"
ON public.transportadoras FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Operadores podem atualizar suas transportadoras"
ON public.transportadoras FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Operadores podem deletar suas transportadoras"
ON public.transportadoras FOR DELETE
USING (user_id = auth.uid());