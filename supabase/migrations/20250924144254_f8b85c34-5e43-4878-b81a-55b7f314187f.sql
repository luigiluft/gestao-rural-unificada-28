-- Add missing columns to saidas table
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS valor_frete_calculado NUMERIC,
ADD COLUMN IF NOT EXISTS fazenda_id UUID,
ADD COLUMN IF NOT EXISTS frete_origem TEXT,
ADD COLUMN IF NOT EXISTS frete_destino TEXT,
ADD COLUMN IF NOT EXISTS frete_distancia NUMERIC,
ADD COLUMN IF NOT EXISTS peso_total NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN public.saidas.valor_frete_calculado IS 'Valor do frete calculado pelo simulador';
COMMENT ON COLUMN public.saidas.fazenda_id IS 'ID da fazenda de destino para entregas';
COMMENT ON COLUMN public.saidas.frete_origem IS 'Nome da origem do frete';
COMMENT ON COLUMN public.saidas.frete_destino IS 'Nome do destino do frete';
COMMENT ON COLUMN public.saidas.frete_distancia IS 'Distância em km para o frete';
COMMENT ON COLUMN public.saidas.peso_total IS 'Peso total da saída em kg';