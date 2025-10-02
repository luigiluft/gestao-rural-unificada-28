-- Fix process_saida_items function to use correct column name
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
    v_total_processado NUMERIC := 0;
BEGIN
    -- Get saida info
    SELECT s.*, p.user_id as produtor_user_id
    INTO v_saida
    FROM saidas s
    JOIN profiles p ON p.user_id = s.user_id
    WHERE s.id = p_saida_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Saída não encontrada';
    END IF;
    
    -- Process each item in the saida
    FOR v_item IN
        SELECT si.*
        FROM saida_itens si
        WHERE si.saida_id = p_saida_id
    LOOP
        v_total_processado := 0;
        
        -- Process each batch reference for this item
        FOR v_referencia IN
            SELECT *
            FROM saida_item_referencias sir
            WHERE sir.saida_item_id = v_item.id
            ORDER BY sir.created_at
        LOOP
            -- Create movement for each batch allocation (negative quantity to debit stock)
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
                v_saida.produtor_user_id,
                v_item.produto_id,
                v_saida.deposito_id,
                'saida',
                -v_referencia.quantidade,  -- Fixed: use quantidade instead of quantidade_alocada
                v_item.valor_unitario,
                p_saida_id,
                'saida',
                v_referencia.lote,
                'Saída de estoque - Lote: ' || v_referencia.lote,
                now()
            );
            
            v_total_processado := v_total_processado + v_referencia.quantidade;
        END LOOP;
        
        -- If no references were found, create a single movement with the item's lote
        IF v_total_processado = 0 THEN
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
                v_saida.produtor_user_id,
                v_item.produto_id,
                v_saida.deposito_id,
                'saida',
                -v_item.quantidade,  -- Negative quantity to debit stock
                v_item.valor_unitario,
                p_saida_id,
                'saida',
                v_item.lote,
                'Saída de estoque',
                now()
            );
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$function$;

-- Backfill: Process all approved saidas that don't have movements yet
DO $$
DECLARE
    v_saida_id UUID;
    v_count INTEGER := 0;
BEGIN
    FOR v_saida_id IN
        SELECT s.id
        FROM saidas s
        WHERE s.status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel')
        AND NOT EXISTS (
            SELECT 1 
            FROM movimentacoes m 
            WHERE m.referencia_id = s.id 
            AND m.referencia_tipo = 'saida'
        )
    LOOP
        BEGIN
            PERFORM public.process_saida_items(v_saida_id);
            v_count := v_count + 1;
            RAISE LOG 'Processed saida % during backfill', v_saida_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Failed to process saida % during backfill: %', v_saida_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE LOG 'Backfill completed: % saidas processed', v_count;
END $$;