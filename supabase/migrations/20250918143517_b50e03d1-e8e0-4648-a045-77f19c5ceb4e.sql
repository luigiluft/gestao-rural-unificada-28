-- Verificar se ainda existe algum trigger ou função que chama refresh_estoque_with_retry
SELECT DISTINCT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE action_statement ILIKE '%refresh_estoque%';

-- Verificar funções que referenciam refresh_estoque_with_retry
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_definition ILIKE '%refresh_estoque_with_retry%';

-- Verificar se há algum trigger restante problemático na tabela saida_itens
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'saida_itens';

-- Verificar se há algum trigger restante problemático na tabela movimentacoes  
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'movimentacoes';