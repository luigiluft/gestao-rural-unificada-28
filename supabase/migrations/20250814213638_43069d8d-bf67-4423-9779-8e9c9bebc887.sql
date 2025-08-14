-- Update the trigger function to handle generated column correctly
CREATE OR REPLACE FUNCTION public.process_entrada_item()
RETURNS TRIGGER AS $$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    existing_estoque_id UUID;
BEGIN
    -- If produto_id is null, try to find or create the product
    IF NEW.produto_id IS NULL THEN
        -- Create a basic product entry with the lote as name
        INSERT INTO public.produtos (
            user_id,
            nome,
            unidade_medida,
            codigo,
            ativo
        ) VALUES (
            NEW.user_id,
            COALESCE(NEW.lote, 'Produto ' || substring(NEW.id::text, 1, 8)),
            'UN', -- Default unit
            NEW.lote,
            true
        ) RETURNING id INTO v_produto_id;
        
        -- Update the entrada_item with the new produto_id
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = NEW.id;
        
        NEW.produto_id = v_produto_id;
    ELSE
        v_produto_id = NEW.produto_id;
    END IF;

    -- Get the deposito_id from the entrada
    SELECT e.deposito_id INTO v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- If no deposito_id in entrada, create a default one
    IF v_deposito_id IS NULL THEN
        INSERT INTO public.depositos (
            user_id,
            nome,
            ativo
        ) VALUES (
            NEW.user_id,
            'Depósito Principal',
            true
        ) RETURNING id INTO v_deposito_id;
        
        -- Update the entrada with the deposito_id
        UPDATE public.entradas 
        SET deposito_id = v_deposito_id 
        WHERE id = NEW.entrada_id;
    END IF;

    -- Check if there's already an estoque entry for this product/deposito/lote combination
    SELECT id INTO existing_estoque_id
    FROM public.estoque
    WHERE produto_id = v_produto_id 
      AND deposito_id = v_deposito_id 
      AND COALESCE(lote, '') = COALESCE(NEW.lote, '')
      AND user_id = NEW.user_id;

    IF existing_estoque_id IS NOT NULL THEN
        -- Update existing stock (don't touch quantidade_disponivel if it's generated)
        UPDATE public.estoque
        SET 
            quantidade_atual = quantidade_atual + NEW.quantidade,
            valor_medio = CASE 
                WHEN quantidade_atual > 0 THEN 
                    ((valor_medio * quantidade_atual) + (COALESCE(NEW.valor_unitario, 0) * NEW.quantidade)) / (quantidade_atual + NEW.quantidade)
                ELSE 
                    COALESCE(NEW.valor_unitario, 0)
            END,
            updated_at = now()
        WHERE id = existing_estoque_id;
    ELSE
        -- Create new stock entry (without quantidade_disponivel)
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
            NEW.user_id,
            v_produto_id,
            v_deposito_id,
            NEW.quantidade,
            0,
            COALESCE(NEW.valor_unitario, 0),
            NEW.lote,
            NEW.data_validade
        );
    END IF;

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
        NEW.user_id,
        v_produto_id,
        v_deposito_id,
        'entrada',
        NEW.quantidade,
        NEW.valor_unitario,
        NEW.entrada_id,
        'entrada',
        NEW.lote,
        'Entrada de estoque via NFe',
        now()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;