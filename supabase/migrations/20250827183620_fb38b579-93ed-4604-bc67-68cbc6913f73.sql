-- Etapa 1: Criar view materializada estoque_calculado baseada em movimentações
CREATE MATERIALIZED VIEW estoque_calculado AS
SELECT 
    gen_random_uuid() as id,
    user_id,
    produto_id,
    deposito_id,
    -- Usar COALESCE para tratar lote null como string vazia no grouping
    COALESCE(lote, '') as lote,
    -- Calcular quantidade atual: soma entradas - soma saídas
    COALESCE(SUM(CASE WHEN tipo_movimentacao = 'entrada' THEN quantidade ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN tipo_movimentacao = 'saida' THEN quantidade ELSE 0 END), 0) as quantidade_atual,
    -- Por enquanto mantemos quantidade_reservada como 0 (será implementado quando necessário)
    0 as quantidade_reservada,
    -- Quantidade disponível = quantidade_atual - quantidade_reservada
    COALESCE(SUM(CASE WHEN tipo_movimentacao = 'entrada' THEN quantidade ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN tipo_movimentacao = 'saida' THEN quantidade ELSE 0 END), 0) as quantidade_disponivel,
    -- Valor médio ponderado (apenas entradas com valor > 0)
    CASE 
        WHEN SUM(CASE WHEN tipo_movimentacao = 'entrada' AND valor_unitario > 0 THEN quantidade ELSE 0 END) > 0 
        THEN SUM(CASE WHEN tipo_movimentacao = 'entrada' AND valor_unitario > 0 THEN quantidade * valor_unitario ELSE 0 END) / 
             SUM(CASE WHEN tipo_movimentacao = 'entrada' AND valor_unitario > 0 THEN quantidade ELSE 0 END)
        ELSE 0
    END as valor_medio,
    -- Buscar data de validade na tabela estoque atual (temporário, até migração completa)
    (SELECT e.data_validade 
     FROM estoque e 
     WHERE e.user_id = m.user_id 
       AND e.produto_id = m.produto_id 
       AND e.deposito_id = m.deposito_id 
       AND COALESCE(e.lote, '') = COALESCE(m.lote, '')
     ORDER BY e.updated_at DESC 
     LIMIT 1) as data_validade,
    -- Data da última movimentação
    MAX(data_movimentacao) as updated_at
FROM movimentacoes m
GROUP BY user_id, produto_id, deposito_id, COALESCE(lote, '')
HAVING 
    -- Só incluir registros com estoque positivo
    COALESCE(SUM(CASE WHEN tipo_movimentacao = 'entrada' THEN quantidade ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN tipo_movimentacao = 'saida' THEN quantidade ELSE 0 END), 0) > 0;

-- Criar índices para performance
CREATE UNIQUE INDEX idx_estoque_calculado_unique ON estoque_calculado(user_id, produto_id, deposito_id, COALESCE(lote, ''));
CREATE INDEX idx_estoque_calculado_user_id ON estoque_calculado(user_id);
CREATE INDEX idx_estoque_calculado_produto_id ON estoque_calculado(produto_id);
CREATE INDEX idx_estoque_calculado_deposito_id ON estoque_calculado(deposito_id);

-- Etapa 2: Criar função para refresh da view materializada
CREATE OR REPLACE FUNCTION refresh_estoque_calculado()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY estoque_calculado;
    RAISE LOG 'Materialized view estoque_calculado refreshed successfully';
END;
$$;

-- Criar trigger para refresh automático quando movimentações são alteradas
CREATE OR REPLACE FUNCTION trigger_refresh_estoque_calculado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh assíncrono da view materializada
    PERFORM refresh_estoque_calculado();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers para refresh automático
CREATE TRIGGER refresh_estoque_on_movimentacao_insert
    AFTER INSERT ON movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_estoque_calculado();

CREATE TRIGGER refresh_estoque_on_movimentacao_update
    AFTER UPDATE ON movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_estoque_calculado();

CREATE TRIGGER refresh_estoque_on_movimentacao_delete
    AFTER DELETE ON movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_estoque_calculado();

-- Etapa 3: Configurar RLS policies para estoque_calculado (baseado nas policies atuais de estoque)
ALTER MATERIALIZED VIEW estoque_calculado ENABLE ROW LEVEL SECURITY;

-- Policy: Delete own rows
CREATE POLICY "Delete own rows" ON estoque_calculado
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Policy: Insert own rows  
CREATE POLICY "Insert own rows" ON estoque_calculado
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Owner or admin can select
CREATE POLICY "Owner or admin can select" ON estoque_calculado
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Policy: Update own rows
CREATE POLICY "Update own rows" ON estoque_calculado
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Policy: Ancestors with estoque.manage can delete
CREATE POLICY "Ancestors with estoque.manage can delete" ON estoque_calculado
FOR DELETE TO authenticated
USING (is_ancestor(auth.uid(), user_id) AND has_permission(auth.uid(), 'estoque.manage'::permission_code));

-- Policy: Ancestors with estoque.manage can insert
CREATE POLICY "Ancestors with estoque.manage can insert" ON estoque_calculado
FOR INSERT TO authenticated
WITH CHECK (is_ancestor(auth.uid(), user_id) AND has_permission(auth.uid(), 'estoque.manage'::permission_code));

-- Policy: Ancestors with estoque.manage can update
CREATE POLICY "Ancestors with estoque.manage can update" ON estoque_calculado
FOR UPDATE TO authenticated
USING (is_ancestor(auth.uid(), user_id) AND has_permission(auth.uid(), 'estoque.manage'::permission_code));

-- Policy: Ancestors with estoque.view/manage can select
CREATE POLICY "Ancestors with estoque.view/manage can select" ON estoque_calculado
FOR SELECT TO authenticated
USING (is_ancestor(auth.uid(), user_id) AND (has_permission(auth.uid(), 'estoque.view'::permission_code) OR has_permission(auth.uid(), 'estoque.manage'::permission_code)));

-- Popular a view materializada com dados iniciais
REFRESH MATERIALIZED VIEW estoque_calculado;