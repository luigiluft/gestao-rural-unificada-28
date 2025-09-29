-- Limpar completamente estoque fantasma - apenas pallets alocados devem gerar estoque
-- Step 1: Drop and recreate the function with correct signature
DROP FUNCTION IF EXISTS public.get_estoque_from_movimentacoes();

-- Step 2: Delete all movements that are NOT from allocated pallets
DELETE FROM public.movimentacoes 
WHERE NOT (
    -- Only keep movements from pallets that are allocated to positions
    referencia_tipo = 'pallet' 
    AND referencia_id IN (
        SELECT ep.id 
        FROM public.entrada_pallets ep
        JOIN public.pallet_positions pp ON pp.pallet_id = ep.id
        WHERE pp.status = 'alocado'
    )
) AND NOT (
    -- Also keep movements from allocation waves that created stock
    referencia_tipo = 'allocation_wave'
);

-- Step 3: Create new get_estoque_from_movimentacoes to only consider positioned pallets
CREATE OR REPLACE FUNCTION public.get_estoque_from_movimentacoes()
RETURNS TABLE(
    produto_id uuid,
    deposito_id uuid,
    user_id uuid,
    lote text,
    quantidade_atual numeric,
    valor_unitario numeric,
    valor_total numeric,
    produtos jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Step 4: Create function to validate that only allocated pallets can create stock
CREATE OR REPLACE FUNCTION public.validate_stock_from_allocated_pallets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow movements from properly allocated pallets or allocation waves
    IF NEW.tipo_movimentacao = 'entrada' AND NEW.quantidade > 0 THEN
        -- Check if it's from an allocated pallet
        IF NEW.referencia_tipo = 'pallet' THEN
            IF NOT EXISTS (
                SELECT 1 
                FROM public.entrada_pallets ep
                JOIN public.pallet_positions pp ON pp.pallet_id = ep.id
                WHERE ep.id = NEW.referencia_id AND pp.status = 'alocado'
            ) THEN
                RAISE EXCEPTION 'Movimentação de entrada rejeitada: pallet % deve estar alocado em uma posição física.', NEW.referencia_id;
            END IF;
        END IF;
        
        -- Allow allocation_wave movements (they are already validated)
        -- Allow other types for now but log them
        IF NEW.referencia_tipo NOT IN ('pallet', 'allocation_wave') THEN
            RAISE LOG 'Movement type % allowed but not from allocated pallet: %', NEW.referencia_tipo, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 5: Create trigger to validate new movements
DROP TRIGGER IF EXISTS trigger_validate_stock_allocated_pallets ON public.movimentacoes;
CREATE TRIGGER trigger_validate_stock_allocated_pallets
    BEFORE INSERT OR UPDATE ON public.movimentacoes
    FOR EACH ROW
    EXECUTE FUNCTION validate_stock_from_allocated_pallets();

-- Step 6: Log the cleanup results
DO $$
DECLARE
    remaining_movements INTEGER;
    total_stock_quantity NUMERIC;
BEGIN
    SELECT COUNT(*) INTO remaining_movements FROM public.movimentacoes;
    SELECT COALESCE(SUM(quantidade_atual), 0) INTO total_stock_quantity FROM public.get_estoque_from_movimentacoes();
    
    RAISE LOG 'Estoque fantasma completamente limpo! Movimentações restantes: %. Quantidade total em estoque (apenas pallets alocados): %', remaining_movements, total_stock_quantity;
END;
$$;