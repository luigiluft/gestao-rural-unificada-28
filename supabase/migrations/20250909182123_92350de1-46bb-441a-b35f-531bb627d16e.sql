-- Fix process_saida_items function to use correct column name and logic
CREATE OR REPLACE FUNCTION public.process_saida_items(p_saida_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_saida RECORD;
    v_item RECORD;
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
        -- Check if movement already exists for this item
        IF NOT EXISTS (
            SELECT 1 FROM public.movimentacoes 
            WHERE referencia_id = p_saida_id 
            AND referencia_tipo = 'saida'
            AND produto_id = v_item.produto_id
        ) THEN
            -- Create movement record for saida
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
                v_item.lote,
                'Saída de estoque - ' || COALESCE(v_saida.observacoes, ''),
                COALESCE(v_saida.data_saida, now()::date)::timestamp
            );
            
            RAISE LOG 'Created movement for saida item: produto_id=%, quantidade=%', v_item.produto_id, -v_item.quantidade;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$function$;

-- Fix trigger function to use correct column name
CREATE OR REPLACE FUNCTION public.trigger_process_saida_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If status changed to approved, process all items
    IF OLD.status_aprovacao_produtor IS DISTINCT FROM NEW.status_aprovacao_produtor 
       AND NEW.status_aprovacao_produtor = 'aprovado' THEN
        PERFORM public.process_saida_items(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Process all existing orphaned saidas (approved but without movements)
DO $$
DECLARE
    orphaned_saida RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Find saidas that are approved but don't have corresponding movements
    FOR orphaned_saida IN
        SELECT DISTINCT s.id, s.status_aprovacao_produtor
        FROM public.saidas s
        WHERE s.status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel')
        AND NOT EXISTS (
            SELECT 1 FROM public.movimentacoes m
            WHERE m.referencia_id = s.id 
            AND m.referencia_tipo = 'saida'
        )
    LOOP
        -- Process each orphaned saida
        IF public.process_saida_items(orphaned_saida.id) THEN
            processed_count := processed_count + 1;
            RAISE LOG 'Processed orphaned saida: % (status: %)', orphaned_saida.id, orphaned_saida.status_aprovacao_produtor;
        END IF;
    END LOOP;
    
    RAISE LOG 'Processed % orphaned saidas total', processed_count;
END;
$$;

-- Refresh the materialized view to update stock calculations
REFRESH MATERIALIZED VIEW public.estoque;