-- Update the trigger function to handle entrada confirmation with null produto_id
CREATE OR REPLACE FUNCTION public.create_allocation_wave_on_entrada_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_wave_id UUID;
    v_wave_number TEXT;
    entrada_item RECORD;
    v_produto_id UUID;
BEGIN
    -- Only process if status changed TO 'confirmado'
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao 
       AND NEW.status_aprovacao = 'confirmado' THEN
        
        -- Generate wave number
        v_wave_number := 'WAVE-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
        
        -- Create allocation wave
        INSERT INTO public.allocation_waves (
            numero_onda,
            deposito_id,
            status,
            created_by
        ) VALUES (
            v_wave_number,
            NEW.deposito_id,
            'pendente',
            COALESCE(auth.uid(), NEW.user_id)
        ) RETURNING id INTO v_wave_id;
        
        -- Create allocation wave items for each entrada item
        FOR entrada_item IN 
            SELECT * FROM public.entrada_itens ei 
            WHERE ei.entrada_id = NEW.id
        LOOP
            -- If produto_id is null, create or find the product
            IF entrada_item.produto_id IS NULL THEN
                -- Try to find existing product by name
                SELECT id INTO v_produto_id
                FROM public.produtos
                WHERE LOWER(nome) = LOWER(entrada_item.nome_produto)
                  AND user_id = entrada_item.user_id
                LIMIT 1;
                
                -- If not found, create new product
                IF v_produto_id IS NULL THEN
                    INSERT INTO public.produtos (
                        user_id,
                        nome,
                        unidade_medida,
                        codigo,
                        ativo
                    ) VALUES (
                        entrada_item.user_id,
                        entrada_item.nome_produto,
                        'UN',
                        entrada_item.lote,
                        true
                    ) RETURNING id INTO v_produto_id;
                END IF;
                
                -- Update entrada_item with produto_id
                UPDATE public.entrada_itens 
                SET produto_id = v_produto_id 
                WHERE id = entrada_item.id;
                
                entrada_item.produto_id := v_produto_id;
            ELSE
                v_produto_id := entrada_item.produto_id;
            END IF;
            
            INSERT INTO public.allocation_wave_items (
                wave_id,
                entrada_item_id,
                produto_id,
                lote,
                quantidade,
                barcode_produto
            ) VALUES (
                v_wave_id,
                entrada_item.id,
                v_produto_id,
                entrada_item.lote,
                entrada_item.quantidade,
                entrada_item.lote -- Use lote as initial barcode
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;