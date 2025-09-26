-- Remover completamente o trigger problemático
DROP TRIGGER IF EXISTS refresh_estoque_on_movimentacao_change ON movimentacoes;

-- Não precisamos recriar um trigger desnecessário
-- O sistema funcionará sem ele, pois o estoque pode ser gerenciado de outras formas

-- Verificar se há outros triggers que possam estar causando problemas
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%refresh_estoque%' OR action_statement ILIKE '%trigger_refresh%';