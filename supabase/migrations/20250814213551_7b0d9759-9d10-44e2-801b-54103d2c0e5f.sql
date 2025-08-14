-- Process existing entrada_itens to create products and stock (corrected)
DO $$
DECLARE
    item RECORD;
    v_produto_id UUID;
    v_deposito_id UUID;
BEGIN
    -- Process each entrada_item that doesn't have a produto_id
    FOR item IN 
        SELECT * FROM public.entrada_itens 
        WHERE produto_id IS NULL
        ORDER BY created_at ASC
    LOOP
        -- Create product
        INSERT INTO public.produtos (
            user_id,
            nome,
            unidade_medida,
            codigo,
            ativo
        ) VALUES (
            item.user_id,
            COALESCE(item.lote, 'Produto ' || substring(item.id::text, 1, 8)),
            'UN',
            item.lote,
            true
        ) RETURNING id INTO v_produto_id;
        
        -- Update entrada_item with produto_id
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = item.id;
        
        -- Get or create deposito
        SELECT e.deposito_id INTO v_deposito_id
        FROM public.entradas e
        WHERE e.id = item.entrada_id;
        
        IF v_deposito_id IS NULL THEN
            INSERT INTO public.depositos (
                user_id,
                nome,
                ativo
            ) VALUES (
                item.user_id,
                'Depósito Principal',
                true
            ) RETURNING id INTO v_deposito_id;
            
            UPDATE public.entradas 
            SET deposito_id = v_deposito_id 
            WHERE id = item.entrada_id;
        END IF;
        
        -- Create stock entry (without quantidade_disponivel as it's generated)
        INSERT INTO public.estoque (
            user_id,
            produto_id,
            deposito_id,
            quantidade_atual,
            quantidade_reservada,
            valor_medio,
            lote,
            data_validade
        ) VALUES (
            item.user_id,
            v_produto_id,
            v_deposito_id,
            item.quantidade,
            0,
            COALESCE(item.valor_unitario, 0),
            item.lote,
            item.data_validade
        );
        
        -- Create movement record
        INSERT INTO public.movimentacoes (
            user_id,
            produto_id,
            deposito_id,
            tipo_movimentacao,
            quantidade,
            valor_unitario,
            referencia_id,
            referencia_tipo,
            lote,
            observacoes,
            data_movimentacao
        ) VALUES (
            item.user_id,
            v_produto_id,
            v_deposito_id,
            'entrada',
            item.quantidade,
            item.valor_unitario,
            item.entrada_id,
            'entrada',
            item.lote,
            'Entrada de estoque via NFe (processado retroativamente)',
            item.created_at
        );
        
    END LOOP;
END $$;