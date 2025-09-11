-- Recriar a função get_estoque_seguro para funcionar corretamente
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
SET search_path = public
AS $$
BEGIN
    -- Para admin: ver tudo
    IF has_role(auth.uid(), 'admin'::app_role) THEN
        RETURN QUERY
        SELECT 
            gen_random_uuid()::text as id,
            pp.user_id,
            epi.produto_id,
            e.deposito_id,
            COALESCE(SUM(epi.quantidade), 0) as quantidade_atual,
            COALESCE(SUM(epi.quantidade), 0) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            COALESCE(SUM(ei.valor_total), 0) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            ARRAY_AGG(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            jsonb_build_object('nome', p.nome, 'unidade_medida', p.unidade_medida) as produtos,
            f.nome as franquia_nome
        FROM pallet_positions pp
        JOIN entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN entradas e ON e.id = ep.entrada_id
        JOIN entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN produtos p ON p.id = epi.produto_id
        LEFT JOIN franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
        GROUP BY pp.user_id, epi.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome;
    
    -- Para franqueado: ver apenas do seu depósito
    ELSIF has_role(auth.uid(), 'franqueado'::app_role) THEN
        RETURN QUERY
        SELECT 
            gen_random_uuid()::text as id,
            pp.user_id,
            epi.produto_id,
            e.deposito_id,
            COALESCE(SUM(epi.quantidade), 0) as quantidade_atual,
            COALESCE(SUM(epi.quantidade), 0) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            COALESCE(SUM(ei.valor_total), 0) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            ARRAY_AGG(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            jsonb_build_object('nome', p.nome, 'unidade_medida', p.unidade_medida) as produtos,
            f.nome as franquia_nome
        FROM pallet_positions pp
        JOIN entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN entradas e ON e.id = ep.entrada_id
        JOIN entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN produtos p ON p.id = epi.produto_id
        LEFT JOIN franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
          AND f.master_franqueado_id = auth.uid()
        GROUP BY pp.user_id, epi.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome;
    
    -- Para produtor: ver apenas seus produtos
    ELSE
        RETURN QUERY
        SELECT 
            gen_random_uuid()::text as id,
            pp.user_id,
            epi.produto_id,
            e.deposito_id,
            COALESCE(SUM(epi.quantidade), 0) as quantidade_atual,
            COALESCE(SUM(epi.quantidade), 0) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            COALESCE(SUM(ei.valor_total), 0) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            ARRAY_AGG(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            jsonb_build_object('nome', p.nome, 'unidade_medida', p.unidade_medida) as produtos,
            f.nome as franquia_nome
        FROM pallet_positions pp
        JOIN entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN entradas e ON e.id = ep.entrada_id
        JOIN entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN produtos p ON p.id = epi.produto_id
        LEFT JOIN franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
          AND pp.user_id = auth.uid()
        GROUP BY pp.user_id, epi.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome;
    END IF;
END;
$$;