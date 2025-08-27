-- Etapa 4: Atualizar funções para remover INSERTs em estoque e apenas criar movimentações

-- Atualizar função process_entrada_item para apenas criar movimentações
CREATE OR REPLACE FUNCTION public.process_entrada_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    v_franqueado_id UUID;
    v_entrada_status entrada_status;
BEGIN
    -- SEMPRE criar/encontrar produto, independente do status da entrada
    -- Se produto_id é null, encontrar ou criar produto
    IF NEW.produto_id IS NULL THEN
        v_produto_id := public.find_or_create_produto(
            NEW.user_id,
            NEW.nome_produto,
            NEW.codigo_ean,
            NEW.codigo_produto,
            NEW.unidade_comercial,
            NEW.descricao_produto
        );
        
        -- Atualizar o entrada_item com o produto_id
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = NEW.id;
        
        NEW.produto_id = v_produto_id;
    ELSE
        v_produto_id = NEW.produto_id;
    END IF;

    -- Verificar o status da entrada para processar movimentação apenas se confirmada
    SELECT e.status_aprovacao, e.deposito_id INTO v_entrada_status, v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- Só processar movimentação se a entrada está confirmada
    IF v_entrada_status != 'confirmado' THEN
        RETURN NEW;
    END IF;

    -- Se não tem deposito_id, encontrar o primeiro disponível
    IF v_deposito_id IS NULL THEN
        SELECT f.id, f.master_franqueado_id INTO v_deposito_id, v_franqueado_id
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        JOIN public.franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
        WHERE uh.child_user_id = NEW.user_id
        LIMIT 1;
        
        IF v_deposito_id IS NULL THEN
            SELECT uh.parent_user_id INTO v_franqueado_id
            FROM public.user_hierarchy uh
            JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
            WHERE uh.child_user_id = NEW.user_id
            LIMIT 1;
            
            IF v_franqueado_id IS NOT NULL THEN
                INSERT INTO public.franquias (
                    master_franqueado_id,
                    nome,
                    ativo
                ) VALUES (
                    v_franqueado_id,
                    'Franquia Principal',
                    true
                ) RETURNING id INTO v_deposito_id;
            END IF;
        END IF;
        
        IF v_deposito_id IS NOT NULL THEN
            UPDATE public.entradas 
            SET deposito_id = v_deposito_id 
            WHERE id = NEW.entrada_id;
        END IF;
    END IF;

    -- Criar apenas o registro de movimentação - o estoque será calculado automaticamente
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
        'Entrada de estoque via NFe - Aprovada pelo franqueado',
        now()
    );

    RETURN NEW;
END;
$$;

-- Atualizar função create_stock_from_pallet para apenas criar movimentações
CREATE OR REPLACE FUNCTION public.create_stock_from_pallet(p_pallet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entrada RECORD;
  v_item RECORD;
  v_pallet_position RECORD;
BEGIN
  -- Get pallet position info
  SELECT pp.*, ep.entrada_id
  INTO v_pallet_position
  FROM pallet_positions pp
  JOIN entrada_pallets ep ON ep.id = pp.pallet_id
  WHERE pp.pallet_id = p_pallet_id AND pp.status = 'alocado';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pallet não encontrado ou não alocado';
  END IF;
  
  -- Get entrada info
  SELECT e.*, p.user_id
  INTO v_entrada
  FROM entradas e
  JOIN profiles p ON p.user_id = e.user_id
  WHERE e.id = v_pallet_position.entrada_id;
  
  -- Process each item in the pallet
  FOR v_item IN
    SELECT 
      ei.*,
      epi.quantidade as quantidade_pallet
    FROM entrada_pallet_itens epi
    JOIN entrada_itens ei ON ei.id = epi.entrada_item_id
    WHERE epi.pallet_id = p_pallet_id
  LOOP
    -- Criar apenas o registro de movimentação - o estoque será calculado automaticamente
    INSERT INTO movimentacoes (
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
      v_entrada.user_id,
      v_item.produto_id,
      v_entrada.deposito_id,
      'entrada',
      v_item.quantidade_pallet,
      v_item.valor_unitario,
      p_pallet_id,
      'pallet',
      v_item.lote,
      'Entrada de estoque via alocação de pallet - Posição: ' || v_pallet_position.posicao_id,
      now()
    );
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Atualizar função complete_allocation_and_create_stock para apenas criar movimentações
CREATE OR REPLACE FUNCTION public.complete_allocation_and_create_stock(p_wave_item_id uuid, p_posicao_id uuid, p_barcode_produto text, p_barcode_posicao text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_item RECORD;
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

    -- Criar apenas o registro de movimentação - o estoque será calculado automaticamente
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
$$;