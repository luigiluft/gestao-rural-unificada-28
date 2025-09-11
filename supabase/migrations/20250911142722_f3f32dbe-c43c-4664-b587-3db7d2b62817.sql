-- Remover todos os triggers relacionados ao estoque
DROP TRIGGER IF EXISTS trigger_refresh_estoque ON movimentacoes;
DROP TRIGGER IF EXISTS trigger_refresh_estoque_on_pallet_positions ON pallet_positions;

-- Remover a função trigger_refresh_estoque também
DROP FUNCTION IF EXISTS trigger_refresh_estoque();
DROP FUNCTION IF EXISTS refresh_estoque();

-- Agora fazer a limpeza das saídas antigas
-- 1. Remover movimentações de saída
DELETE FROM movimentacoes WHERE referencia_tipo = 'saida';

-- 2. Remover itens de saída 
DELETE FROM saida_itens;

-- 3. Remover saídas principais
DELETE FROM saidas;