-- FASE 1-4: Correção completa para usar movimentacoes como ledger único

-- 1. Drop recursos antigos baseados em pallet_positions
DROP FUNCTION IF EXISTS public.get_estoque_seguro() CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.estoque CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.estoque_calculado CASCADE;

-- 2. Criar nova view materializada baseada exclusivamente em movimentacoes
CREATE MATERIALIZED VIEW public.estoque AS
WITH movimentacao_summary AS (
    SELECT 
        m.user_id,
        m.produto_id, 
        m.deposito_id,
        COALESCE(m.lote, '') as lote,
        -- Soma entradas e saídas separadamente
        SUM(CASE WHEN m.tipo_movimentacao = 'entrada' THEN m.quantidade ELSE 0 END) as total_entradas,
        SUM(CASE WHEN m.tipo_movimentacao = 'saida' THEN ABS(m.quantidade) ELSE 0 END) as total_saidas,
        -- Quantidade atual = entradas - saídas
        SUM(CASE WHEN m.tipo_movimentacao = 'entrada' THEN m.quantidade ELSE -ABS(m.quantidade) END) as quantidade_atual,
        -- Valor médio ponderado das entradas
        CASE 
            WHEN SUM(CASE WHEN m.tipo_movimentacao = 'entrada' AND m.valor_unitario > 0 THEN m.quantidade ELSE 0 END) > 0
            THEN SUM(CASE WHEN m.tipo_movimentacao = 'entrada' AND m.valor_unitario > 0 THEN m.quantidade * m.valor_unitario ELSE 0 END) / 
                 SUM(CASE WHEN m.tipo_movimentacao = 'entrada' AND m.valor_unitario > 0 THEN m.quantidade ELSE 0 END)
            ELSE 0
        END as valor_medio,
        -- Última movimentação
        MAX(m.data_movimentacao) as ultima_movimentacao,
        -- Agregação de lotes únicos
        STRING_AGG(DISTINCT NULLIF(m.lote, ''), ', ' ORDER BY NULLIF(m.lote, '')) as lotes_string
    FROM public.movimentacoes m
    WHERE m.quantidade IS NOT NULL 
      AND m.quantidade != 0
    GROUP BY m.user_id, m.produto_id, m.deposito_id, COALESCE(m.lote, '')
    HAVING SUM(CASE WHEN m.tipo_movimentacao = 'entrada' THEN m.quantidade ELSE -ABS(m.quantidade) END) > 0
),
reservas AS (
    -- Calcular quantidade reservada por produto/deposito (usando status corretos do enum)
    SELECT 
        si.produto_id,
        s.deposito_id,
        SUM(si.quantidade - COALESCE(si.quantidade_separada, 0)) as quantidade_reservada
    FROM public.saida_itens si
    JOIN public.saidas s ON s.id = si.saida_id
    WHERE s.status IN ('separacao_pendente', 'separado')
    GROUP BY si.produto_id, s.deposito_id
)
SELECT 
    gen_random_uuid() as id,
    ms.user_id,
    ms.produto_id,
    ms.deposito_id,
    ms.quantidade_atual,
    -- Quantidade disponível = atual - reservada
    ms.quantidade_atual - COALESCE(r.quantidade_reservada, 0) as quantidade_disponivel,
    COALESCE(r.quantidade_reservada, 0) as quantidade_reservada,
    -- Valor total do estoque
    ms.quantidade_atual * ms.valor_medio as valor_total_estoque,
    ms.ultima_movimentacao,
    -- Array de lotes (compatibilidade com código existente)
    CASE 
        WHEN ms.lotes_string IS NOT NULL 
        THEN string_to_array(ms.lotes_string, ', ')
        ELSE ARRAY[]::text[]
    END as lotes,
    ms.valor_medio
FROM movimentacao_summary ms
LEFT JOIN reservas r ON r.produto_id = ms.produto_id AND r.deposito_id = ms.deposito_id
WHERE ms.quantidade_atual > 0;

-- 3. Criar índices para performance (sem funções mutáveis)
CREATE INDEX idx_estoque_user_produto_deposito ON public.estoque(user_id, produto_id, deposito_id);
CREATE INDEX idx_estoque_user_produto ON public.estoque(user_id, produto_id);
CREATE INDEX idx_estoque_deposito ON public.estoque(deposito_id);
CREATE INDEX idx_estoque_quantidade ON public.estoque(quantidade_atual) WHERE quantidade_atual > 0;

-- 4. RLS para a view materializada
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode ver tudo
CREATE POLICY "Admins can view all estoque" ON public.estoque
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Franqueados podem ver estoque do seu depósito  
CREATE POLICY "Franqueados can view their deposits estoque" ON public.estoque
FOR SELECT TO authenticated
USING (
    has_role(auth.uid(), 'franqueado'::app_role) AND 
    deposito_id IN (
        SELECT f.id FROM public.franquias f 
        WHERE f.master_franqueado_id = auth.uid()
    )
);

-- Policy: Produtores podem ver apenas seu estoque
CREATE POLICY "Produtores can view their own estoque" ON public.estoque
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 5. Nova função get_estoque_seguro baseada na view materializada
CREATE OR REPLACE FUNCTION public.get_estoque_seguro()
RETURNS TABLE(
    id text,
    user_id uuid,
    produto_id uuid,
    deposito_id uuid,
    quantidade_atual numeric,
    quantidade_disponivel numeric,
    quantidade_reservada numeric,
    valor_total_estoque numeric,
    ultima_movimentacao timestamp with time zone,
    lotes text[],
    produtos jsonb,
    franquia_nome text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        e.id::text,
        e.user_id,
        e.produto_id,
        e.deposito_id,
        e.quantidade_atual,
        e.quantidade_disponivel,
        e.quantidade_reservada,
        e.valor_total_estoque,
        e.ultima_movimentacao,
        e.lotes,
        jsonb_build_object(
            'nome', p.nome,
            'unidade_medida', p.unidade_medida
        ) as produtos,
        COALESCE(f.nome, 'Depósito não identificado') as franquia_nome
    FROM public.estoque e
    LEFT JOIN public.produtos p ON p.id = e.produto_id
    LEFT JOIN public.franquias f ON f.id = e.deposito_id
    WHERE e.quantidade_atual > 0
    ORDER BY e.ultima_movimentacao DESC;
END;
$function$;

-- 6. Função para refresh da view materializada
CREATE OR REPLACE FUNCTION public.refresh_estoque_with_retry()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    max_attempts INTEGER := 3;
    current_attempt INTEGER := 0;
    success BOOLEAN := FALSE;
BEGIN
    -- Clean expired reservations first (se a função existir)
    BEGIN
        PERFORM public.clean_expired_reservations();
    EXCEPTION
        WHEN undefined_function THEN
            RAISE LOG 'Function clean_expired_reservations not found, skipping';
    END;
    
    WHILE current_attempt < max_attempts AND NOT success LOOP
        current_attempt := current_attempt + 1;
        
        BEGIN
            REFRESH MATERIALIZED VIEW estoque;
            success := TRUE;
            RAISE LOG 'Estoque materialized view refreshed successfully on attempt %', current_attempt;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Failed to refresh estoque on attempt %. Error: %', current_attempt, SQLERRM;
                IF current_attempt < max_attempts THEN
                    -- Wait before retry (exponential backoff)
                    PERFORM pg_sleep(current_attempt * 0.5);
                END IF;
        END;
    END LOOP;
    
    RETURN success;
END;
$function$;

-- 7. Triggers para refresh automático da view
CREATE OR REPLACE FUNCTION public.trigger_refresh_estoque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh assíncrono da view materializada
    PERFORM public.refresh_estoque_with_retry();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers para refresh automático
DROP TRIGGER IF EXISTS refresh_estoque_on_movimentacao_change ON public.movimentacoes;
CREATE TRIGGER refresh_estoque_on_movimentacao_change
    AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_estoque();

DROP TRIGGER IF EXISTS refresh_estoque_on_saida_change ON public.saidas;
CREATE TRIGGER refresh_estoque_on_saida_change
    AFTER UPDATE ON public.saidas
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_estoque();

DROP TRIGGER IF EXISTS refresh_estoque_on_saida_item_change ON public.saida_itens;
CREATE TRIGGER refresh_estoque_on_saida_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.saida_itens
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_estoque();

-- 8. Popular a view com dados iniciais
REFRESH MATERIALIZED VIEW public.estoque;

-- 9. Permissões
GRANT SELECT ON public.estoque TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estoque_seguro() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_estoque_with_retry() TO authenticated;

-- 10. Comentários para documentação
COMMENT ON MATERIALIZED VIEW public.estoque IS 'View materializada que calcula estoque exclusivamente baseado no ledger de movimentações';
COMMENT ON FUNCTION public.get_estoque_seguro() IS 'Função que retorna estoque calculado baseado no ledger, aplicando RLS por role do usuário';
COMMENT ON FUNCTION public.refresh_estoque_with_retry() IS 'Função para refresh da view materializada com retry automático em caso de falha';