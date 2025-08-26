-- Função com logs detalhados para debug de alocação de pallets
CREATE OR REPLACE FUNCTION public.complete_pallet_allocation_and_create_stock_debug(
    p_wave_pallet_id uuid, 
    p_posicao_id uuid, 
    p_barcode_pallet text, 
    p_barcode_posicao text, 
    p_produtos_conferidos jsonb, 
    p_divergencias jsonb DEFAULT '[]'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_pallet RECORD;
    v_position_record RECORD;
    v_wave_id UUID;
    v_pending_pallets_count INTEGER;
    v_entrada RECORD;
    produto_conf RECORD;
    v_existing_estoque_id UUID;
BEGIN
    RAISE LOG '🚀 INÍCIO DA FUNÇÃO DEBUG - complete_pallet_allocation_and_create_stock_debug';
    RAISE LOG '📥 Parâmetros recebidos:';
    RAISE LOG '  - p_wave_pallet_id: %', p_wave_pallet_id;
    RAISE LOG '  - p_posicao_id: %', p_posicao_id;
    RAISE LOG '  - p_barcode_pallet: %', p_barcode_pallet;
    RAISE LOG '  - p_barcode_posicao: %', p_barcode_posicao;
    RAISE LOG '  - p_produtos_conferidos: %', p_produtos_conferidos;
    RAISE LOG '  - p_divergencias: %', p_divergencias;

    -- Get wave pallet details
    RAISE LOG '🔍 Buscando detalhes do wave pallet...';
    SELECT 
        wp.*,
        w.deposito_id,
        ep.entrada_id,
        ep.numero_pallet
    INTO v_pallet
    FROM public.allocation_wave_pallets wp
    JOIN public.allocation_waves w ON w.id = wp.wave_id
    JOIN public.entrada_pallets ep ON ep.id = wp.entrada_pallet_id
    WHERE wp.id = p_wave_pallet_id;
    
    IF NOT FOUND THEN
        RAISE LOG '❌ ERRO: Wave pallet não encontrado para ID: %', p_wave_pallet_id;
        RAISE EXCEPTION 'Wave pallet not found';
    END IF;
    
    RAISE LOG '📦 Wave pallet encontrado:';
    RAISE LOG '  - ID: %', v_pallet.id;
    RAISE LOG '  - wave_id: %', v_pallet.wave_id;
    RAISE LOG '  - deposito_id: %', v_pallet.deposito_id;
    RAISE LOG '  - entrada_id: %', v_pallet.entrada_id;
    RAISE LOG '  - numero_pallet: %', v_pallet.numero_pallet;
    
    -- Store wave_id for later use
    v_wave_id := v_pallet.wave_id;
    
    -- Get entrada details
    RAISE LOG '🔍 Buscando detalhes da entrada...';
    SELECT e.*, p.user_id 
    INTO v_entrada
    FROM public.entradas e
    JOIN public.profiles p ON p.user_id = e.user_id
    WHERE e.id = v_pallet.entrada_id;
    
    IF NOT FOUND THEN
        RAISE LOG '❌ ERRO: Entrada não encontrada para ID: %', v_pallet.entrada_id;
        RAISE EXCEPTION 'Entrada not found';
    END IF;
    
    RAISE LOG '📋 Entrada encontrada:';
    RAISE LOG '  - ID: %', v_entrada.id;
    RAISE LOG '  - user_id: %', v_entrada.user_id;
    RAISE LOG '  - status_aprovacao: %', v_entrada.status_aprovacao;
    
    -- Check position status
    RAISE LOG '🔍 Verificando status da posição...';
    SELECT 
        ocupado,
        reservado_temporariamente,
        reservado_por_wave_id,
        codigo
    INTO v_position_record
    FROM public.storage_positions
    WHERE id = p_posicao_id AND ativo = true;
    
    IF NOT FOUND THEN
        RAISE LOG '❌ ERRO: Posição não encontrada ou inativa para ID: %', p_posicao_id;
        RAISE EXCEPTION 'Storage position not found or inactive';
    END IF;
    
    RAISE LOG '📍 Posição encontrada:';
    RAISE LOG '  - codigo: %', v_position_record.codigo;
    RAISE LOG '  - ocupado: %', v_position_record.ocupado;
    RAISE LOG '  - reservado_temporariamente: %', v_position_record.reservado_temporariamente;
    RAISE LOG '  - reservado_por_wave_id: %', v_position_record.reservado_por_wave_id;
    
    -- Validate position availability
    IF v_position_record.ocupado = true THEN
        RAISE LOG '❌ ERRO: Posição já ocupada. Código: %', v_position_record.codigo;
        RAISE EXCEPTION 'Esta posição já está ocupada. Código: %', v_position_record.codigo;
    END IF;
    
    RAISE LOG '✅ Posição disponível para alocação';
    
    -- Update wave pallet as allocated
    RAISE LOG '🔄 Atualizando wave pallet como alocado...';
    UPDATE public.allocation_wave_pallets
    SET 
        posicao_id = p_posicao_id,
        status = CASE 
            WHEN jsonb_array_length(p_divergencias) > 0 THEN 'com_divergencia'
            ELSE 'alocado'
        END,
        produtos_conferidos = p_produtos_conferidos,
        divergencias = p_divergencias,
        data_alocacao = now(),
        alocado_por = auth.uid(),
        updated_at = now()
    WHERE id = p_wave_pallet_id;
    
    RAISE LOG '✅ Wave pallet atualizado com sucesso';
    
    -- Mark position as occupied
    RAISE LOG '🔄 Marcando posição como ocupada...';
    UPDATE public.storage_positions
    SET 
        ocupado = true,
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL,
        updated_at = now()
    WHERE id = p_posicao_id;
    
    RAISE LOG '✅ Posição marcada como ocupada';
    
    -- Process each confirmed product to create stock entries
    RAISE LOG '🔄 Processando produtos conferidos para criar entradas de estoque...';
    FOR produto_conf IN 
        SELECT 
            (item->>'produto_id')::UUID as produto_id,
            (item->>'quantidade_conferida')::NUMERIC as quantidade_conferida,
            item->>'lote' as lote,
            (item->>'valor_unitario')::NUMERIC as valor_unitario,
            (item->>'data_validade')::DATE as data_validade
        FROM jsonb_array_elements(p_produtos_conferidos) as item
        WHERE (item->>'status') = 'conferido'
    LOOP
        RAISE LOG '📦 Processando produto:';
        RAISE LOG '  - produto_id: %', produto_conf.produto_id;
        RAISE LOG '  - quantidade_conferida: %', produto_conf.quantidade_conferida;
        RAISE LOG '  - lote: %', produto_conf.lote;
        RAISE LOG '  - valor_unitario: %', produto_conf.valor_unitario;
        
        -- Check if there's already an estoque entry for this exact combination
        RAISE LOG '🔍 Verificando se já existe entrada no estoque...';
        SELECT id INTO v_existing_estoque_id
        FROM public.estoque
        WHERE produto_id = produto_conf.produto_id 
          AND deposito_id = v_pallet.deposito_id 
          AND posicao_id = p_posicao_id
          AND COALESCE(lote, '') = COALESCE(produto_conf.lote, '')
          AND user_id = v_entrada.user_id;

        IF v_existing_estoque_id IS NOT NULL THEN
            RAISE LOG '🔄 Atualizando estoque existente (ID: %)', v_existing_estoque_id;
            -- Update existing stock
            UPDATE public.estoque
            SET 
                quantidade_atual = quantidade_atual + produto_conf.quantidade_conferida,
                valor_medio = CASE 
                    WHEN quantidade_atual > 0 THEN 
                        ((valor_medio * quantidade_atual) + (produto_conf.valor_unitario * produto_conf.quantidade_conferida)) / (quantidade_atual + produto_conf.quantidade_conferida)
                    ELSE 
                        produto_conf.valor_unitario
                END,
                updated_at = now()
            WHERE id = v_existing_estoque_id;
            RAISE LOG '✅ Estoque existente atualizado';
        ELSE
            RAISE LOG '➕ Criando nova entrada no estoque';
            -- Create new stock entry
            INSERT INTO public.estoque (
                user_id,
                produto_id,
                deposito_id,
                posicao_id,
                quantidade_atual,
                quantidade_reservada,
                valor_medio,
                lote,
                data_validade
            ) VALUES (
                v_entrada.user_id,
                produto_conf.produto_id,
                v_pallet.deposito_id,
                p_posicao_id,
                produto_conf.quantidade_conferida,
                0,
                produto_conf.valor_unitario,
                produto_conf.lote,
                produto_conf.data_validade
            );
            RAISE LOG '✅ Nova entrada no estoque criada';
        END IF;

        -- Create movement record
        RAISE LOG '📝 Criando registro de movimentação...';
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
            v_entrada.user_id,
            produto_conf.produto_id,
            v_pallet.deposito_id,
            'entrada',
            produto_conf.quantidade_conferida,
            produto_conf.valor_unitario,
            v_wave_id,
            'allocation_wave',
            produto_conf.lote,
            'Entrada de estoque via alocação - Posição: ' || p_barcode_posicao,
            now()
        );
        RAISE LOG '✅ Registro de movimentação criado';
    END LOOP;

    -- Check if all pallets in the wave are now allocated
    RAISE LOG '🔍 Verificando se todos os pallets da onda foram alocados...';
    SELECT COUNT(*) INTO v_pending_pallets_count
    FROM public.allocation_wave_pallets
    WHERE wave_id = v_wave_id 
      AND status = 'pendente';
    
    RAISE LOG '📊 Pallets pendentes restantes: %', v_pending_pallets_count;
    
    -- If no pending pallets remain, mark wave as completed
    IF v_pending_pallets_count = 0 THEN
        RAISE LOG '🎉 Todos os pallets alocados! Marcando onda como concluída...';
        UPDATE public.allocation_waves
        SET 
            status = 'concluido',
            data_conclusao = now()
        WHERE id = v_wave_id;
        
        RAISE LOG '✅ Onda % marcada como concluída', v_wave_id;
    END IF;

    RAISE LOG '🏁 Função executada com sucesso! Retornando TRUE';
    RETURN TRUE;
END;
$function$;