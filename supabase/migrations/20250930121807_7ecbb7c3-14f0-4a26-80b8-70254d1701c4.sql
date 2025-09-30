-- Update the get_estoque_from_movimentacoes function to exclude damaged products
CREATE OR REPLACE FUNCTION public.get_estoque_from_movimentacoes()
 RETURNS TABLE(produto_id uuid, deposito_id uuid, user_id uuid, lote text, quantidade_atual numeric, valor_unitario numeric, valor_total numeric, produtos jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        m.produto_id,
        m.deposito_id,
        m.user_id,
        m.lote,
        SUM(m.quantidade) as quantidade_atual,
        AVG(m.valor_unitario) as valor_unitario,
        SUM(m.quantidade * COALESCE(m.valor_unitario, 0)) as valor_total,
        jsonb_build_object(
            'nome', p.nome,
            'codigo', p.codigo,
            'unidade_medida', p.unidade_medida
        ) as produtos
    FROM public.movimentacoes m
    JOIN public.produtos p ON p.id = m.produto_id
    WHERE 
        -- Only consider movements from allocated pallets or allocation waves
        (
            (m.referencia_tipo = 'pallet' AND m.referencia_id IN (
                SELECT ep.id 
                FROM public.entrada_pallets ep
                JOIN public.pallet_positions pp ON pp.pallet_id = ep.id
                WHERE pp.status = 'alocado'
                -- Exclude movements from pallets that contain only damaged items
                AND NOT EXISTS (
                    SELECT 1 
                    FROM public.entrada_pallet_itens epi
                    WHERE epi.pallet_id = ep.id 
                    AND epi.is_avaria = true
                )
            ))
            OR 
            (m.referencia_tipo = 'allocation_wave')
        )
    GROUP BY 
        m.produto_id, 
        m.deposito_id, 
        m.user_id, 
        m.lote,
        p.nome,
        p.codigo,
        p.unidade_medida
    HAVING SUM(m.quantidade) > 0
    ORDER BY p.nome, m.lote;
END;
$function$