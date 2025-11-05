-- Add saida_id column to ocorrencias table
ALTER TABLE public.ocorrencias
ADD COLUMN saida_id UUID REFERENCES public.saidas(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_ocorrencias_saida_id ON public.ocorrencias(saida_id);

-- Add comment
COMMENT ON COLUMN public.ocorrencias.saida_id IS 'ID da saída específica relacionada à ocorrência (opcional)';