-- Drop existing function
DROP FUNCTION IF EXISTS public.process_saida_items(uuid);

-- Recreate function with correct lote handling from saida_item_referencias
CREATE OR REPLACE FUNCTION public.process_saida_items(p_saida_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_saida RECORD;
    v_item RECORD;
    v_referencia RECORD;
BEGIN
    -- Get saida details
    SELECT s.*, p.user_id 
    INTO v_saida
    FROM public.saidas s
    JOIN public.profiles p ON p.user_id = s.user_id
    WHERE s.id = p_saida_id;
    
    IF NOT FOUND THEN
        RAISE LOG 'Saida not found: %', p_saida_id;
        RETURN FALSE;
    END IF;
    
    -- Process if saida is approved OR auto-approved (nao_aplicavel for producer-created saidas)
    IF v_saida.status_aprovacao_produtor NOT IN ('aprovado', 'nao_aplicavel') THEN
        RAISE LOG 'Saida % not approved (status: %), skipping movement creation', p_saida_id, v_saida.status_aprovacao_produtor;
        RETURN FALSE;
    END IF;
    
    -- Process each item in the saida
    FOR v_item IN
        SELECT si.*
        FROM public.saida_itens si
        WHERE si.saida_id = p_saida_id
    LOOP
        RAISE LOG 'Processing saida_item: % for product: %', v_item.id, v_item.produto_id;
        
        -- Check if item has allocation references (new FEFO system)
        IF EXISTS (
            SELECT 1 FROM public.saida_item_referencias 
            WHERE saida_item_id = v_item.id
        ) THEN
            RAISE LOG 'Item has allocation references - creating movements per reference';
            
            -- Create one movement per allocation reference
            FOR v_referencia IN
                SELECT sir.*
                FROM public.saida_item_referencias sir
                WHERE sir.saida_item_id = v_item.id
                ORDER BY sir.data_validade ASC NULLS LAST
            LOOP
                -- Check if movement already exists for this specific reference
                IF NOT EXISTS (
                    SELECT 1 FROM public.movimentacoes 
                    WHERE referencia_id = p_saida_id 
                    AND referencia_tipo = 'saida'
                    AND produto_id = v_item.produto_id
                    AND lote = v_referencia.lote
                    AND quantidade = -v_referencia.quantidade_alocada
                ) THEN
                    -- Create movement with the specific lote from reference
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
                        data_validade,
                        observacoes,
                        data_movimentacao
                    ) VALUES (
                        v_saida.user_id,
                        v_item.produto_id,
                        v_saida.deposito_id,
                        'saida',
                        -v_referencia.quantidade_alocada, -- Negative for outbound
                        v_item.valor_unitario,
                        p_saida_id,
                        'saida',
                        v_referencia.lote, -- Use lote from allocation reference
                        v_referencia.data_validade,
                        'Saída de estoque (lote: ' || COALESCE(v_referencia.lote, 'N/A') || ') - ' || COALESCE(v_saida.observacoes, ''),
                        COALESCE(v_saida.data_saida, now()::date)::timestamp
                    );
                    
                    RAISE LOG 'Created movement for lote: %, quantidade: %', v_referencia.lote, -v_referencia.quantidade_alocada;
                END IF;
            END LOOP;
        ELSE
            -- Fallback: no allocation references, use item lote (legacy support)
            RAISE LOG 'No allocation references - using saida_item.lote (legacy mode)';
            
            IF NOT EXISTS (
                SELECT 1 FROM public.movimentacoes 
                WHERE referencia_id = p_saida_id 
                AND referencia_tipo = 'saida'
                AND produto_id = v_item.produto_id
            ) THEN
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
                    v_saida.user_id,
                    v_item.produto_id,
                    v_saida.deposito_id,
                    'saida',
                    -v_item.quantidade, -- Negative for outbound movement
                    v_item.valor_unitario,
                    p_saida_id,
                    'saida',
                    v_item.lote, -- Use lote from saida_item
                    'Saída de estoque - ' || COALESCE(v_saida.observacoes, ''),
                    COALESCE(v_saida.data_saida, now()::date)::timestamp
                );
                
                RAISE LOG 'Created movement (legacy) for lote: %, quantidade: %', v_item.lote, -v_item.quantidade;
            END IF;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$function$;

-- Add comment
COMMENT ON FUNCTION public.process_saida_items(uuid) IS 'Process saida items and create movements with correct lote from saida_item_referencias';