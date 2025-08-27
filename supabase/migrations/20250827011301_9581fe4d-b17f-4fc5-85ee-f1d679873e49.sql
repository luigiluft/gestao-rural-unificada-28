-- Primeiro, vamos criar uma constraint única para a tabela estoque
-- Isso é necessário para o ON CONFLICT funcionar corretamente
CREATE UNIQUE INDEX IF NOT EXISTS idx_estoque_unique 
ON public.estoque (user_id, produto_id, deposito_id, COALESCE(lote, ''));

-- Agora vamos corrigir a função complete_pallet_allocation_and_create_stock
-- para usar a constraint correta
CREATE OR REPLACE FUNCTION public.complete_pallet_allocation_and_create_stock(
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
    -- Get wave pallet details
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
        RAISE EXCEPTION 'Wave pallet not found';
    END IF;
    
    -- Store wave_id for later use
    v_wave_id := v_pallet.wave_id;
    
    -- Get entrada details
    SELECT e.*, p.user_id 
    INTO v_entrada
    FROM public.entradas e
    JOIN public.profiles p ON p.user_id = e.user_id
    WHERE e.id = v_pallet.entrada_id;
    
    -- Check position status
    SELECT 
        ocupado,
        reservado_temporariamente,
        reservado_por_wave_id,
        codigo
    INTO v_position_record
    FROM public.storage_positions
    WHERE id = p_posicao_id AND ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Storage position not found or inactive';
    END IF;
    
    -- Validate position availability
    IF v_position_record.ocupado = true THEN
        RAISE EXCEPTION 'Esta posição já está ocupada. Código: %', v_position_record.codigo;
    END IF;
    
    -- Update wave pallet as allocated
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
    
    -- Mark position as occupied
    UPDATE public.storage_positions
    SET 
        ocupado = true,
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL,
        updated_at = now()
    WHERE id = p_posicao_id;
    
    -- Process each confirmed product to create stock entries
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
        -- First check if estoque already exists
        SELECT id INTO v_existing_estoque_id
        FROM public.estoque
        WHERE user_id = v_entrada.user_id
        AND produto_id = produto_conf.produto_id
        AND deposito_id = v_pallet.deposito_id
        AND COALESCE(lote, '') = COALESCE(produto_conf.lote, '');
        
        IF v_existing_estoque_id IS NOT NULL THEN
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
                data_validade,
                updated_at
            ) VALUES (
                v_entrada.user_id,
                produto_conf.produto_id,
                v_pallet.deposito_id,
                produto_conf.quantidade_conferida,
                0,
                produto_conf.valor_unitario,
                produto_conf.lote,
                produto_conf.data_validade,
                now()
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
    END LOOP;

    -- Check if all pallets in the wave are now allocated
    SELECT COUNT(*) INTO v_pending_pallets_count
    FROM public.allocation_wave_pallets
    WHERE wave_id = v_wave_id 
      AND status = 'pendente';
    
    -- If no pending pallets remain, mark wave as completed
    IF v_pending_pallets_count = 0 THEN
        UPDATE public.allocation_waves
        SET 
            status = 'concluido',
            data_conclusao = now()
        WHERE id = v_wave_id;
        
        RAISE LOG 'Wave % marked as completed - all pallets allocated', v_wave_id;
    END IF;

    RETURN TRUE;
END;
$function$;