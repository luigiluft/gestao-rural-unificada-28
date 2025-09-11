-- Remove materialized view estoque and replace with pallet-based calculation
DROP MATERIALIZED VIEW IF EXISTS public.estoque;

-- Remove triggers that refresh the materialized view
DROP TRIGGER IF EXISTS trigger_refresh_estoque_movimentacoes ON public.movimentacoes;
DROP TRIGGER IF EXISTS trigger_refresh_estoque_storage_positions ON public.storage_positions;

-- Recreate get_estoque_seguro function based on pallet positions
CREATE OR REPLACE FUNCTION public.get_estoque_seguro()
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is not authenticated, return empty result
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;
    
    -- Check user role and return appropriate data
    IF has_role(auth.uid(), 'admin'::app_role) THEN
        -- Admin can see all stock from allocated pallets
        RETURN QUERY
        SELECT 
            gen_random_uuid() as id,
            e.user_id,
            ei.produto_id,
            e.deposito_id,
            SUM(epi.quantidade) as quantidade_atual,
            SUM(epi.quantidade) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            SUM(epi.quantidade * ei.valor_unitario) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            array_agg(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.pallet_positions pp
        JOIN public.entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN public.entradas e ON e.id = ep.entrada_id
        JOIN public.entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN public.entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN public.produtos p ON p.id = ei.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
        GROUP BY e.user_id, ei.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome
        HAVING SUM(epi.quantidade) > 0;
        
    ELSIF has_role(auth.uid(), 'franqueado'::app_role) THEN
        -- Franqueado can see stock from their franquia
        RETURN QUERY
        SELECT 
            gen_random_uuid() as id,
            e.user_id,
            ei.produto_id,
            e.deposito_id,
            SUM(epi.quantidade) as quantidade_atual,
            SUM(epi.quantidade) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            SUM(epi.quantidade * ei.valor_unitario) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            array_agg(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.pallet_positions pp
        JOIN public.entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN public.entradas e ON e.id = ep.entrada_id
        JOIN public.entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN public.entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN public.produtos p ON p.id = ei.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
        AND e.deposito_id IN (
            SELECT fr.id 
            FROM public.franquias fr 
            WHERE fr.master_franqueado_id = auth.uid()
        )
        GROUP BY e.user_id, ei.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome
        HAVING SUM(epi.quantidade) > 0;
        
    ELSIF has_role(auth.uid(), 'produtor'::app_role) THEN
        -- Produtor can see their own stock
        RETURN QUERY
        SELECT 
            gen_random_uuid() as id,
            e.user_id,
            ei.produto_id,
            e.deposito_id,
            SUM(epi.quantidade) as quantidade_atual,
            SUM(epi.quantidade) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            SUM(epi.quantidade * ei.valor_unitario) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            array_agg(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.pallet_positions pp
        JOIN public.entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN public.entradas e ON e.id = ep.entrada_id
        JOIN public.entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN public.entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN public.produtos p ON p.id = ei.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
        AND e.user_id = auth.uid()
        GROUP BY e.user_id, ei.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome
        HAVING SUM(epi.quantidade) > 0;
        
    ELSE
        -- For any authenticated user, show all stock (fallback)
        RETURN QUERY
        SELECT 
            gen_random_uuid() as id,
            e.user_id,
            ei.produto_id,
            e.deposito_id,
            SUM(epi.quantidade) as quantidade_atual,
            SUM(epi.quantidade) as quantidade_disponivel,
            0::numeric as quantidade_reservada,
            SUM(epi.quantidade * ei.valor_unitario) as valor_total_estoque,
            MAX(pp.alocado_em) as ultima_movimentacao,
            array_agg(DISTINCT ei.lote) FILTER (WHERE ei.lote IS NOT NULL) as lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.pallet_positions pp
        JOIN public.entrada_pallets ep ON ep.id = pp.pallet_id
        JOIN public.entradas e ON e.id = ep.entrada_id
        JOIN public.entrada_pallet_itens epi ON epi.pallet_id = ep.id
        JOIN public.entrada_itens ei ON ei.id = epi.entrada_item_id
        JOIN public.produtos p ON p.id = ei.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE pp.status = 'alocado'
        GROUP BY e.user_id, ei.produto_id, e.deposito_id, p.nome, p.unidade_medida, f.nome
        HAVING SUM(epi.quantidade) > 0;
    END IF;
END;
$$;