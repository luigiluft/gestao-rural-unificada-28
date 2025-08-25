-- Modificar trigger para não auto-alocar posições
CREATE OR REPLACE FUNCTION public.create_allocation_wave_on_entrada_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_wave_id UUID;
    v_wave_number TEXT;
    entrada_item RECORD;
BEGIN
    -- Only process if status changed TO 'confirmado'
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao 
       AND NEW.status_aprovacao = 'confirmado' THEN
        
        -- Generate wave number
        v_wave_number := 'WAVE-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
        
        -- Create allocation wave (sem auto-alocar posições)
        INSERT INTO public.allocation_waves (
            numero_onda,
            deposito_id,
            status,
            created_by
        ) VALUES (
            v_wave_number,
            NEW.deposito_id,
            'pendente',  -- Status inicial pendente
            COALESCE(auth.uid(), NEW.user_id)
        ) RETURNING id INTO v_wave_id;
        
        -- Create allocation wave items for each entrada item
        FOR entrada_item IN 
            SELECT * FROM public.entrada_itens ei 
            WHERE ei.entrada_id = NEW.id
        LOOP
            -- Se ainda não tem produto_id, usar find_or_create_produto
            IF entrada_item.produto_id IS NULL THEN
                UPDATE public.entrada_itens 
                SET produto_id = public.find_or_create_produto(
                    entrada_item.user_id,
                    entrada_item.nome_produto,
                    entrada_item.codigo_ean,
                    entrada_item.codigo_produto,
                    entrada_item.unidade_comercial,
                    entrada_item.descricao_produto
                )
                WHERE id = entrada_item.id
                RETURNING produto_id INTO entrada_item.produto_id;
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
                entrada_item.produto_id,
                entrada_item.lote,
                entrada_item.quantidade,
                entrada_item.lote -- Use lote as initial barcode
            );
        END LOOP;
        
        -- NÃO executar alocação automática - deixar status como 'pendente'
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar nova função para definir posições manualmente
CREATE OR REPLACE FUNCTION public.define_wave_positions(p_wave_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    wave_item RECORD;
    available_position RECORD;
    position_allocated BOOLEAN;
    reservation_duration INTERVAL := INTERVAL '2 hours';
    total_items INTEGER := 0;
    allocated_items INTEGER := 0;
    insufficient_positions BOOLEAN := FALSE;
BEGIN
    -- Verificar se a onda existe e está pendente
    IF NOT EXISTS (
        SELECT 1 FROM allocation_waves 
        WHERE id = p_wave_id AND status = 'pendente'
    ) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Onda não encontrada ou não está pendente'
        );
    END IF;
    
    -- Limpar reservas expiradas primeiro
    PERFORM public.clean_expired_reservations();
    
    -- Contar total de itens
    SELECT COUNT(*) INTO total_items
    FROM allocation_wave_items 
    WHERE wave_id = p_wave_id AND status = 'pendente';
    
    -- Verificar se há posições suficientes disponíveis
    DECLARE
        available_positions_count INTEGER;
        deposito_id_var UUID;
    BEGIN
        -- Obter deposito_id da onda
        SELECT deposito_id INTO deposito_id_var
        FROM allocation_waves
        WHERE id = p_wave_id;
        
        -- Contar posições disponíveis
        SELECT COUNT(*) INTO available_positions_count
        FROM storage_positions sp
        WHERE sp.deposito_id = deposito_id_var
        AND sp.ativo = true
        AND sp.ocupado = false
        AND (sp.reservado_temporariamente = false OR sp.reservado_temporariamente IS NULL);
        
        IF available_positions_count < total_items THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Posições insuficientes. Necessário: ' || total_items || ', Disponível: ' || available_positions_count
            );
        END IF;
    END;
    
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
            AND (sp.reservado_temporariamente = false OR sp.reservado_temporariamente IS NULL)
            ORDER BY sp.codigo
            LIMIT 1
        LOOP
            -- Reservar a posição temporariamente para este item
            UPDATE storage_positions
            SET 
                reservado_temporariamente = true,
                reservado_ate = now() + reservation_duration,
                reservado_por_wave_id = p_wave_id
            WHERE id = available_position.id;
            
            -- Alocar a posição para este item
            UPDATE allocation_wave_items
            SET posicao_id = available_position.id
            WHERE id = wave_item.id;
            
            position_allocated := TRUE;
            allocated_items := allocated_items + 1;
            RAISE LOG 'Position % temporarily reserved for wave item %', available_position.codigo, wave_item.id;
            EXIT; -- Sair do loop de posições
        END LOOP;
        
        -- Se não encontrou posição disponível
        IF NOT position_allocated THEN
            insufficient_positions := TRUE;
            EXIT; -- Sair do loop principal
        END IF;
    END LOOP;
    
    -- Se não conseguiu alocar todas as posições, reverter
    IF insufficient_positions THEN
        -- Limpar reservas desta onda
        UPDATE public.storage_positions
        SET 
            reservado_temporariamente = false,
            reservado_ate = NULL,
            reservado_por_wave_id = NULL
        WHERE reservado_por_wave_id = p_wave_id;
        
        -- Limpar posições dos itens
        UPDATE public.allocation_wave_items
        SET posicao_id = NULL
        WHERE wave_id = p_wave_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Não foi possível alocar todas as posições necessárias'
        );
    END IF;
    
    -- Atualizar status da onda para 'posicoes_definidas'
    UPDATE public.allocation_waves 
    SET status = 'posicoes_definidas'
    WHERE id = p_wave_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Posições definidas com sucesso',
        'allocated_items', allocated_items,
        'total_items', total_items
    );
END;
$function$;