-- Add temporary reservation fields to storage_positions
ALTER TABLE public.storage_positions 
ADD COLUMN reservado_temporariamente boolean DEFAULT false,
ADD COLUMN reservado_ate timestamp with time zone,
ADD COLUMN reservado_por_wave_id uuid;

-- Create function to clean expired reservations
CREATE OR REPLACE FUNCTION public.clean_expired_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Release expired temporary reservations
    UPDATE public.storage_positions
    SET 
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL
    WHERE reservado_temporariamente = true 
      AND reservado_ate < now()
    RETURNING id INTO cleaned_count;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RAISE LOG 'Cleaned % expired reservations', cleaned_count;
    RETURN cleaned_count;
END;
$function$;

-- Updated auto_allocate_positions function with proper reservation logic
CREATE OR REPLACE FUNCTION public.auto_allocate_positions(p_wave_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    wave_item RECORD;
    available_position RECORD;
    position_allocated BOOLEAN;
    reservation_duration INTERVAL := INTERVAL '2 hours';
BEGIN
    -- Clean expired reservations first
    PERFORM public.clean_expired_reservations();
    
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
        -- Não ocupada e não reservada temporariamente
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
            RAISE LOG 'Position % temporarily reserved for wave item %', available_position.codigo, wave_item.id;
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
$function$;

-- Updated complete_allocation_and_create_stock function
CREATE OR REPLACE FUNCTION public.complete_allocation_and_create_stock(p_wave_item_id uuid, p_posicao_id uuid, p_barcode_produto text, p_barcode_posicao text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_item RECORD;
    v_entrada_item RECORD;
    v_existing_estoque_id UUID;
    v_position_record RECORD;
    v_wave_id UUID;
    v_pending_items_count INTEGER;
BEGIN
    -- Get wave item details
    SELECT 
        wi.*,
        w.deposito_id,
        ei.user_id,
        ei.valor_unitario,
        ei.data_validade
    INTO v_item
    FROM public.allocation_wave_items wi
    JOIN public.allocation_waves w ON w.id = wi.wave_id
    JOIN public.entrada_itens ei ON ei.id = wi.entrada_item_id
    WHERE wi.id = p_wave_item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wave item not found';
    END IF;
    
    -- Store wave_id for later use
    v_wave_id := v_item.wave_id;
    
    -- Check position status and reservation
    SELECT 
        ocupado,
        reservado_temporariamente,
        reservado_por_wave_id,
        reservado_ate,
        codigo
    INTO v_position_record
    FROM public.storage_positions
    WHERE id = p_posicao_id AND ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Storage position not found or inactive';
    END IF;
    
    -- Validate position availability
    IF v_position_record.ocupado = true THEN
        RAISE EXCEPTION 'Esta posição já está ocupada por outro produto. Código: %', v_position_record.codigo;
    END IF;
    
    -- Check if position is properly reserved for this wave
    IF v_position_record.reservado_temporariamente = true THEN
        IF v_position_record.reservado_por_wave_id != v_wave_id THEN
            RAISE EXCEPTION 'Esta posição está reservada para outra onda de alocação. Código: %', v_position_record.codigo;
        END IF;
        
        IF v_position_record.reservado_ate < now() THEN
            RAISE EXCEPTION 'A reserva desta posição expirou. Reprocesse a onda. Código: %', v_position_record.codigo;
        END IF;
    END IF;
    
    -- Update wave item as allocated
    UPDATE public.allocation_wave_items
    SET 
        posicao_id = p_posicao_id,
        barcode_produto = p_barcode_produto,
        barcode_posicao = p_barcode_posicao,
        quantidade_alocada = quantidade,
        status = 'alocado',
        data_alocacao = now(),
        alocado_por = auth.uid()
    WHERE id = p_wave_item_id;
    
    -- Mark position as occupied and clear temporary reservation
    UPDATE public.storage_positions
    SET 
        ocupado = true,
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL,
        updated_at = now()
    WHERE id = p_posicao_id;
    
    -- Check if there's already an estoque entry for this product/deposito/lote combination
    SELECT id INTO v_existing_estoque_id
    FROM public.estoque
    WHERE produto_id = v_item.produto_id 
      AND deposito_id = v_item.deposito_id 
      AND COALESCE(lote, '') = COALESCE(v_item.lote, '')
      AND user_id = v_item.user_id;

    IF v_existing_estoque_id IS NOT NULL THEN
        -- Update existing stock
        UPDATE public.estoque
        SET 
            quantidade_atual = quantidade_atual + v_item.quantidade,
            valor_medio = CASE 
                WHEN quantidade_atual > 0 THEN 
                    ((valor_medio * quantidade_atual) + (COALESCE(v_item.valor_unitario, 0) * v_item.quantidade)) / (quantidade_atual + v_item.quantidade)
                ELSE 
                    COALESCE(v_item.valor_unitario, 0)
            END,
            updated_at = now()
        WHERE id = v_existing_estoque_id;
    ELSE
        -- Create new stock entry
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
            v_item.user_id,
            v_item.produto_id,
            v_item.deposito_id,
            v_item.quantidade,
            0,
            COALESCE(v_item.valor_unitario, 0),
            v_item.lote,
            v_item.data_validade
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
        v_item.user_id,
        v_item.produto_id,
        v_item.deposito_id,
        'entrada',
        v_item.quantidade,
        v_item.valor_unitario,
        v_item.wave_id,
        'allocation_wave',
        v_item.lote,
        'Entrada de estoque via alocação - Posição: ' || p_barcode_posicao,
        now()
    );

    -- Check if all items in the wave are now allocated
    SELECT COUNT(*) INTO v_pending_items_count
    FROM public.allocation_wave_items
    WHERE wave_id = v_wave_id 
      AND status = 'pendente';
    
    -- If no pending items remain, mark wave as completed
    IF v_pending_items_count = 0 THEN
        UPDATE public.allocation_waves
        SET 
            status = 'concluido',
            data_conclusao = now()
        WHERE id = v_wave_id;
        
        RAISE LOG 'Wave % marked as completed - all items allocated', v_wave_id;
    END IF;

    RETURN TRUE;
END;
$function$;

-- Function to fix existing incorrectly occupied positions
CREATE OR REPLACE FUNCTION public.fix_incorrectly_occupied_positions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    -- Find positions marked as occupied but with no actual stock
    UPDATE public.storage_positions
    SET ocupado = false
    WHERE ocupado = true
    AND id NOT IN (
        SELECT DISTINCT sp.id
        FROM storage_positions sp
        JOIN estoque e ON e.deposito_id = sp.deposito_id
        WHERE e.quantidade_atual > 0
        AND sp.ocupado = true
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RAISE LOG 'Fixed % incorrectly occupied positions', fixed_count;
    RETURN fixed_count;
END;
$function$;

-- Run the fix function to correct existing data
SELECT public.fix_incorrectly_occupied_positions();

-- Clean any existing expired reservations
SELECT public.clean_expired_reservations();