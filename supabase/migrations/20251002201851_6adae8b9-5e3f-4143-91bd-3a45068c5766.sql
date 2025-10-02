-- Fix process_saida_items to correctly identify producer ID
-- Use COALESCE(produtor_destinatario_id, user_id) to handle both cases:
-- 1. Saidas created by franqueado (produtor_destinatario_id is set)
-- 2. Saidas created by produtor (user_id is the producer)

CREATE OR REPLACE FUNCTION public.process_saida_items(p_saida_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_item RECORD;
    v_saida RECORD;
    v_deposito_id UUID;
    v_produtor_user_id UUID;
BEGIN
    -- Get saida details
    SELECT s.*, COALESCE(s.produtor_destinatario_id, s.user_id) as producer_id
    INTO v_saida
    FROM public.saidas s
    WHERE s.id = p_saida_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Saida not found';
    END IF;
    
    -- Store the correct producer ID
    v_produtor_user_id := v_saida.producer_id;
    v_deposito_id := v_saida.deposito_id;
    
    RAISE LOG 'Processing saida % for producer % in deposit %', 
        p_saida_id, v_produtor_user_id, v_deposito_id;
    
    -- Process each item in the saida
    FOR v_item IN
        SELECT si.*, sir.lote, sir.data_validade
        FROM public.saida_itens si
        LEFT JOIN public.saida_item_referencias sir ON sir.saida_item_id = si.id
        WHERE si.saida_id = p_saida_id
    LOOP
        RAISE LOG 'Creating movement for product % with quantity % from lote %', 
            v_item.produto_id, v_item.quantidade, v_item.lote;
        
        -- Create movement record for stock deduction
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
            v_produtor_user_id,
            v_item.produto_id,
            v_deposito_id,
            'saida',
            -v_item.quantidade, -- Negative for stock deduction
            v_item.valor_unitario,
            p_saida_id,
            'saida',
            v_item.lote,
            'Saída de estoque - ID: ' || p_saida_id,
            now()
        );
        
        RAISE LOG 'Movement created successfully for product %', v_item.produto_id;
    END LOOP;
    
    RETURN TRUE;
END;
$function$;

-- Backfill: Process the two orphaned saidas that were created by producer
-- These saidas were approved but never generated stock movements

DO $$
DECLARE
    orphan_id UUID;
    orphan_ids UUID[] := ARRAY[
        'a33167bb-5cab-4b7e-a7e5-f04242526ced'::uuid,
        '72b2737a-127c-4b76-8e87-1c4670679d3b'::uuid
    ];
BEGIN
    FOREACH orphan_id IN ARRAY orphan_ids
    LOOP
        -- Check if movements already exist for this saida
        IF NOT EXISTS (
            SELECT 1 FROM public.movimentacoes 
            WHERE referencia_tipo = 'saida' 
            AND referencia_id = orphan_id
        ) THEN
            RAISE LOG 'Processing orphaned saida: %', orphan_id;
            PERFORM public.process_saida_items(orphan_id);
            RAISE LOG 'Successfully processed orphaned saida: %', orphan_id;
        ELSE
            RAISE LOG 'Saida % already has movements, skipping', orphan_id;
        END IF;
    END LOOP;
END $$;