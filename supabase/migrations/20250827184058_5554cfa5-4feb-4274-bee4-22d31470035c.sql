-- Etapa 5: Remover tabela estoque original e renomear view materializada

-- Primeiro, fazer backup dos dados da tabela estoque para verificação (opcional)
-- CREATE TABLE estoque_backup AS SELECT * FROM estoque;

-- Remover a tabela estoque original
DROP TABLE IF EXISTS public.estoque CASCADE;

-- Renomear a view materializada para 'estoque' para manter compatibilidade
ALTER MATERIALIZED VIEW estoque_calculado RENAME TO estoque;

-- Recriar os índices com nomes corretos
DROP INDEX IF EXISTS idx_estoque_calculado_unique;
DROP INDEX IF EXISTS idx_estoque_calculado_user_id;
DROP INDEX IF EXISTS idx_estoque_calculado_produto_id;
DROP INDEX IF EXISTS idx_estoque_calculado_deposito_id;

-- Criar novos índices
CREATE UNIQUE INDEX idx_estoque_unique ON estoque(user_id, produto_id, deposito_id, COALESCE(lote, ''));
CREATE INDEX idx_estoque_user_id ON estoque(user_id);
CREATE INDEX idx_estoque_produto_id ON estoque(produto_id);
CREATE INDEX idx_estoque_deposito_id ON estoque(deposito_id);

-- Atualizar função de refresh para novo nome
CREATE OR REPLACE FUNCTION refresh_estoque()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY estoque;
    RAISE LOG 'Materialized view estoque refreshed successfully';
END;
$$;

-- Atualizar triggers para usar nova função
DROP TRIGGER IF EXISTS refresh_estoque_on_movimentacao_insert ON movimentacoes;
DROP TRIGGER IF EXISTS refresh_estoque_on_movimentacao_update ON movimentacoes;
DROP TRIGGER IF EXISTS refresh_estoque_on_movimentacao_delete ON movimentacoes;

-- Atualizar função de trigger
CREATE OR REPLACE FUNCTION trigger_refresh_estoque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Refresh assíncrono da view materializada
    PERFORM refresh_estoque();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recriar triggers com nova função
CREATE TRIGGER refresh_estoque_on_movimentacao_insert
    AFTER INSERT ON movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_estoque();

CREATE TRIGGER refresh_estoque_on_movimentacao_update
    AFTER UPDATE ON movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_estoque();

CREATE TRIGGER refresh_estoque_on_movimentacao_delete
    AFTER DELETE ON movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_estoque();

-- Remover funções antigas
DROP FUNCTION IF EXISTS refresh_estoque_calculado();
DROP FUNCTION IF EXISTS trigger_refresh_estoque_calculado();

-- Popular a view materializada atualizada
REFRESH MATERIALIZED VIEW estoque;