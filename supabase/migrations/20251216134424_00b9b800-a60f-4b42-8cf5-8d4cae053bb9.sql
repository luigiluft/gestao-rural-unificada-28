-- Add destinatario_transferencia_id column to saidas table
-- This column stores the destination establishment for transfer operations
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS destinatario_transferencia_id UUID REFERENCES public.clientes(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_saidas_destinatario_transferencia_id 
ON public.saidas(destinatario_transferencia_id) 
WHERE destinatario_transferencia_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.saidas.destinatario_transferencia_id IS 'ID do cliente/estabelecimento destinatário para operações de transferência (CFOP 5.151/5.152/6.151/6.152)';