-- Limpar registros órfãos da tabela movimentacoes que fazem referência às tabelas allocation removidas
DELETE FROM public.movimentacoes 
WHERE referencia_tipo IN ('allocation_wave', 'allocation_wave_pallet');

-- Adicionar constraint para validar referencia_tipo e prevenir futuros problemas
ALTER TABLE public.movimentacoes 
ADD CONSTRAINT valid_referencia_tipo 
CHECK (referencia_tipo IN ('entrada', 'saida', 'pallet', 'inventario', 'ajuste'));

-- Atualizar view materializada do estoque após limpeza
REFRESH MATERIALIZED VIEW CONCURRENTLY public.estoque;