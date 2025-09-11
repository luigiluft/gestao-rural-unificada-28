-- Remover todos os triggers e funções relacionados ao estoque com CASCADE
DROP FUNCTION IF EXISTS trigger_refresh_estoque() CASCADE;
DROP FUNCTION IF EXISTS refresh_estoque() CASCADE;

-- Agora fazer a limpeza das saídas antigas
-- 1. Remover movimentações de saída
DELETE FROM movimentacoes WHERE referencia_tipo = 'saida';

-- 2. Remover itens de saída 
DELETE FROM saida_itens;

-- 3. Remover saídas principais
DELETE FROM saidas;