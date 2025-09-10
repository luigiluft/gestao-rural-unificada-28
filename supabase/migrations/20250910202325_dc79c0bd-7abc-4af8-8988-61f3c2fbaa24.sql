-- Fix get_estoque_seguro function to handle null auth.uid()
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
        -- Admin can see all stock
        RETURN QUERY
        SELECT 
            e.id,
            e.user_id,
            e.produto_id,
            e.deposito_id,
            e.quantidade_atual,
            e.quantidade_disponivel,
            e.quantidade_reservada,
            e.valor_total_estoque,
            e.ultima_movimentacao,
            e.lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.estoque e
        JOIN public.produtos p ON p.id = e.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE e.quantidade_atual > 0;
        
    ELSIF has_role(auth.uid(), 'franqueado'::app_role) THEN
        -- Franqueado can see stock from their franquia
        RETURN QUERY
        SELECT 
            e.id,
            e.user_id,
            e.produto_id,
            e.deposito_id,
            e.quantidade_atual,
            e.quantidade_disponivel,
            e.quantidade_reservada,
            e.valor_total_estoque,
            e.ultima_movimentacao,
            e.lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.estoque e
        JOIN public.produtos p ON p.id = e.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE e.quantidade_atual > 0
        AND e.deposito_id IN (
            SELECT fr.id 
            FROM public.franquias fr 
            WHERE fr.master_franqueado_id = auth.uid()
        );
        
    ELSIF has_role(auth.uid(), 'produtor'::app_role) THEN
        -- Produtor can see their own stock
        RETURN QUERY
        SELECT 
            e.id,
            e.user_id,
            e.produto_id,
            e.deposito_id,
            e.quantidade_atual,
            e.quantidade_disponivel,
            e.quantidade_reservada,
            e.valor_total_estoque,
            e.ultima_movimentacao,
            e.lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.estoque e
        JOIN public.produtos p ON p.id = e.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE e.quantidade_atual > 0
        AND e.user_id = auth.uid();
        
    ELSE
        -- For any authenticated user, show all stock (fallback)
        RETURN QUERY
        SELECT 
            e.id,
            e.user_id,
            e.produto_id,
            e.deposito_id,
            e.quantidade_atual,
            e.quantidade_disponivel,
            e.quantidade_reservada,
            e.valor_total_estoque,
            e.ultima_movimentacao,
            e.lotes,
            to_jsonb(row(p.nome, p.unidade_medida)) as produtos,
            f.nome as franquia_nome
        FROM public.estoque e
        JOIN public.produtos p ON p.id = e.produto_id
        LEFT JOIN public.franquias f ON f.id = e.deposito_id
        WHERE e.quantidade_atual > 0;
    END IF;
END;
$$;