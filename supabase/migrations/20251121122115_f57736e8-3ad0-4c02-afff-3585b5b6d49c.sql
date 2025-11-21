-- Adicionar coluna capacidade_maxima à tabela storage_positions
ALTER TABLE public.storage_positions 
ADD COLUMN IF NOT EXISTS capacidade_maxima numeric DEFAULT 1.0;

-- Criar constraint unique para deposito_id + codigo
ALTER TABLE public.storage_positions 
ADD CONSTRAINT storage_positions_deposito_codigo_unique 
UNIQUE (deposito_id, codigo);

-- Atualizar RLS policy dos franqueados para considerar franquia_usuarios
DROP POLICY IF EXISTS "Franqueados can manage their deposit positions" ON public.storage_positions;
DROP POLICY IF EXISTS "Franqueados can view their deposit positions" ON public.storage_positions;

CREATE POLICY "Franqueados can manage their deposit positions"
ON public.storage_positions
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND deposito_id IN (
    SELECT fu.franquia_id 
    FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.ativo = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND deposito_id IN (
    SELECT fu.franquia_id 
    FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.ativo = true
  )
);

COMMENT ON COLUMN public.storage_positions.capacidade_maxima IS 'Capacidade máxima de carga da posição em toneladas';