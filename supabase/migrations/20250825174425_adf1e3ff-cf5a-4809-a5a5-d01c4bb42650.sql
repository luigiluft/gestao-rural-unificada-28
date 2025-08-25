-- Add posicao_id to estoque table to track which specific position stores each product
ALTER TABLE public.estoque 
ADD COLUMN posicao_id UUID REFERENCES public.storage_positions(id);

-- Add index for better performance when querying by position
CREATE INDEX idx_estoque_posicao_id ON public.estoque(posicao_id);

-- Add index for better performance when querying by deposito and position together
CREATE INDEX idx_estoque_deposito_posicao ON public.estoque(deposito_id, posicao_id);