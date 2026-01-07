-- Adicionar campo uf_veiculo nas tabelas saidas e entradas
ALTER TABLE public.saidas ADD COLUMN IF NOT EXISTS uf_veiculo TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS uf_veiculo TEXT;

-- Comentários explicativos
COMMENT ON COLUMN public.saidas.uf_veiculo IS 'UF de registro do veículo (obrigatório para documentos fiscais como CT-e)';
COMMENT ON COLUMN public.entradas.uf_veiculo IS 'UF de registro do veículo (obrigatório para documentos fiscais como CT-e)';
COMMENT ON COLUMN public.saidas.valor_produtos IS 'Valor total dos produtos (soma de quantidade * preco_unitario)';
COMMENT ON COLUMN public.saidas.valor_frete IS 'Valor do frete cobrado';
COMMENT ON COLUMN public.saidas.valor_seguro IS 'Valor do seguro da carga';
COMMENT ON COLUMN public.entradas.valor_produtos IS 'Valor total dos produtos';
COMMENT ON COLUMN public.entradas.valor_frete IS 'Valor do frete';
COMMENT ON COLUMN public.entradas.valor_seguro IS 'Valor do seguro';