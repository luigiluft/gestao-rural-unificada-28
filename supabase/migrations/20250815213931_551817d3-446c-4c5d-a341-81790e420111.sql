-- Add new columns to entrada_itens table for additional traceability fields
ALTER TABLE public.entrada_itens 
ADD COLUMN IF NOT EXISTS quantidade_lote numeric,
ADD COLUMN IF NOT EXISTS data_fabricacao date;