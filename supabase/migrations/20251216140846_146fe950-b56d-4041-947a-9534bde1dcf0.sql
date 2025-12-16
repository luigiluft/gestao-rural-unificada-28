-- Add cliente_destinatario_id column to saidas table
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS cliente_destinatario_id UUID REFERENCES public.clientes(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_saidas_cliente_destinatario_id ON public.saidas(cliente_destinatario_id);

-- Add comment for documentation
COMMENT ON COLUMN public.saidas.cliente_destinatario_id IS 'ID do cliente destinatário da venda (para B2B e integração automática de documentos)';