-- Remover função e triggers que ainda tentam modificar a tabela estoque

-- Verificar se há triggers na tabela movimentacoes que usam a função update_estoque_on_movimentacao
DROP TRIGGER IF EXISTS trigger_update_estoque_on_movimentacao ON movimentacoes;

-- Remover a função que tenta fazer INSERT/UPDATE na tabela estoque
DROP FUNCTION IF EXISTS update_estoque_on_movimentacao();

-- Verificar se há outros triggers problemáticos na tabela movimentacoes
-- e remover qualquer trigger que tente modificar estoque diretamente
DROP TRIGGER IF EXISTS update_estoque_after_movimentacao ON movimentacoes;
DROP TRIGGER IF EXISTS estoque_trigger ON movimentacoes;

-- Garantir que apenas os triggers de refresh da view materializada existam
SELECT tgname, tgrelid::regclass as table_name 
FROM pg_trigger 
WHERE tgrelid = 'movimentacoes'::regclass;