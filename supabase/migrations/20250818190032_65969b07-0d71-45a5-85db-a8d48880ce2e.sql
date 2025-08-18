-- Add quantidade_separada column to saida_itens table
ALTER TABLE public.saida_itens 
ADD COLUMN quantidade_separada numeric DEFAULT 0;