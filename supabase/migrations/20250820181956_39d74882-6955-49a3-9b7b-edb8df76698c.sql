-- Função para alocação automática de posições
CREATE OR REPLACE FUNCTION public.auto_allocate_positions(
    p_wave_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    wave_item RECORD;
    available_position RECORD;
    position_allocated BOOLEAN;
BEGIN
    -- Percorrer todos os itens da onda que ainda não tem posição
    FOR wave_item IN 
        SELECT * FROM allocation_wave_items 
        WHERE wave_id = p_wave_id 
        AND posicao_id IS NULL 
        AND status = 'pendente'
        ORDER BY created_at
    LOOP
        position_allocated := FALSE;
        
        -- Encontrar a primeira posição disponível no depósito
        FOR available_position IN 
            SELECT sp.* 
            FROM storage_positions sp
            JOIN allocation_waves aw ON aw.deposito_id = sp.deposito_id
            WHERE aw.id = p_wave_id
            AND sp.ativo = true
            AND sp.ocupado = false
            ORDER BY sp.codigo
            LIMIT 1
        LOOP
            -- Alocar a posição para este item
            UPDATE allocation_wave_items
            SET posicao_id = available_position.id
            WHERE id = wave_item.id;
            
            -- Marcar a posição como temporariamente reservada
            UPDATE storage_positions
            SET ocupado = true
            WHERE id = available_position.id;
            
            position_allocated := TRUE;
            EXIT; -- Sair do loop de posições
        END LOOP;
        
        -- Se não encontrou posição disponível, log o erro
        IF NOT position_allocated THEN
            RAISE NOTICE 'Nenhuma posição disponível para o item % (produto %)', 
                wave_item.id, wave_item.produto_id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- Modificar a função de criação de ondas para incluir alocação automática
CREATE OR REPLACE FUNCTION public.create_allocation_wave_on_entrada_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        
        -- Executar alocação automática de posições
        PERFORM public.auto_allocate_positions(v_wave_id);
        
        -- Atualizar status da onda para 'posicoes_definidas'
        UPDATE public.allocation_waves 
        SET status = 'posicoes_definidas'
        WHERE id = v_wave_id;
    END IF;
    
    RETURN NEW;
END;
$$;