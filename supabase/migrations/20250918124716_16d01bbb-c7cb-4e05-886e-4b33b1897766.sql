-- Create new function to calculate stock directly from movimentacoes
CREATE OR REPLACE FUNCTION public.get_estoque_from_movimentacoes()
RETURNS TABLE(
    id uuid,
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
SET search_path = public
AS $$
DECLARE
    current_user_role app_role;
    current_user_franquia_id uuid;
BEGIN
    -- Get current user role
    SELECT role INTO current_user_role
    FROM profiles p
    WHERE p.user_id = auth.uid();
    
    -- Get current user franquia if applicable
    SELECT get_user_franquia_id(auth.uid()) INTO current_user_franquia_id;
    
    RETURN QUERY
    SELECT 
        gen_random_uuid() as id,
        m.user_id,
        m.produto_id,
        m.deposito_id,
        COALESCE(SUM(m.quantidade), 0) as quantidade_atual,
        COALESCE(SUM(m.quantidade), 0) as quantidade_disponivel, -- Simplified for now
        0::numeric as quantidade_reservada, -- Simplified for now
        COALESCE(SUM(m.quantidade * COALESCE(m.valor_unitario, 0)), 0) as valor_total_estoque,
        MAX(m.data_movimentacao) as ultima_movimentacao,
        ARRAY_AGG(DISTINCT m.lote) FILTER (WHERE m.lote IS NOT NULL) as lotes,
        jsonb_build_object(
            'nome', p.nome,
            'unidade_medida', p.unidade_medida
        ) as produtos,
        f.nome as franquia_nome
    FROM movimentacoes m
    JOIN produtos p ON p.id = m.produto_id
    LEFT JOIN franquias f ON f.id = m.deposito_id
    WHERE 
        -- Apply RLS based on user role
        CASE 
            WHEN current_user_role = 'admin' THEN true
            WHEN current_user_role = 'franqueado' THEN 
                m.deposito_id = current_user_franquia_id
            WHEN current_user_role = 'produtor' THEN 
                m.user_id = auth.uid() OR 
                (m.deposito_id = current_user_franquia_id AND EXISTS (
                    SELECT 1 FROM produtores pr 
                    WHERE pr.user_id = auth.uid() AND pr.franquia_id = m.deposito_id
                ))
            ELSE false
        END
        AND p.ativo = true
    GROUP BY 
        m.user_id, 
        m.produto_id, 
        m.deposito_id, 
        p.nome, 
        p.unidade_medida,
        f.nome
    HAVING 
        COALESCE(SUM(m.quantidade), 0) > 0
    ORDER BY 
        p.nome, 
        MAX(m.data_movimentacao) DESC;
END;
$$;