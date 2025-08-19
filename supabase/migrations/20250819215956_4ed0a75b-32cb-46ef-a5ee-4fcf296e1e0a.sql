-- Fix existing entrada_itens with null produto_id by creating products for them
DO $$
DECLARE
    item RECORD;
    v_produto_id UUID;
BEGIN
    -- Loop through all entrada_itens with null produto_id
    FOR item IN 
        SELECT * FROM public.entrada_itens 
        WHERE produto_id IS NULL AND nome_produto IS NOT NULL
    LOOP
        -- Try to find existing product by name and user
        SELECT id INTO v_produto_id
        FROM public.produtos
        WHERE LOWER(nome) = LOWER(item.nome_produto)
          AND user_id = item.user_id
        LIMIT 1;
        
        -- If not found, create new product
        IF v_produto_id IS NULL THEN
            INSERT INTO public.produtos (
                user_id,
                nome,
                unidade_medida,
                codigo,
                ativo,
                created_at,
                updated_at
            ) VALUES (
                item.user_id,
                item.nome_produto,
                'UN',
                COALESCE(item.lote, 'AUTO-' || substring(item.id::text, 1, 8)),
                true,
                now(),
                now()
            ) RETURNING id INTO v_produto_id;
        END IF;
        
        -- Update entrada_item with produto_id
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = item.id;
        
        RAISE NOTICE 'Produto criado/vinculado para item %: % (produto_id: %)', item.id, item.nome_produto, v_produto_id;
    END LOOP;
END $$;