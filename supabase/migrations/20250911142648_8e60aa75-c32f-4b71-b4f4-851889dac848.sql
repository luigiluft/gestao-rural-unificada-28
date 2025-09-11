-- Limpeza completa das saídas antigas
-- Ordem: movimentações -> itens -> saídas principais

-- 1. Remover movimentações de saída
DELETE FROM movimentacoes WHERE referencia_tipo = 'saida';

-- 2. Remover itens de saída 
DELETE FROM saida_itens;

-- 3. Remover saídas principais
DELETE FROM saidas;