-- Function to process saida items and create movements
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
    
    -- Only process if saida is approved
    IF v_saida.status_aprovacao != 'aprovado' THEN
        RAISE LOG 'Saida % not approved, skipping movement creation', p_saida_id;
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
                v_item.quantidade,
                v_item.valor_unitario,
                p_saida_id,
                'saida',
                v_item.lote,
                'Saída de estoque - ' || COALESCE(v_saida.observacoes, ''),
                COALESCE(v_saida.data_saida, now()::date)::timestamp
            );
            
            RAISE LOG 'Created movement for saida item: produto_id=%, quantidade=%', v_item.produto_id, v_item.quantidade;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$function$;

-- Trigger function to process saida items when inserted
CREATE OR REPLACE FUNCTION public.trigger_process_saida_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_saida_status TEXT;
BEGIN
    -- Check if the saida is already approved
    SELECT status_aprovacao INTO v_saida_status
    FROM public.saidas
    WHERE id = NEW.saida_id;
    
    -- If saida is approved, process immediately
    IF v_saida_status = 'aprovado' THEN
        PERFORM public.process_saida_items(NEW.saida_id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Trigger function to process saida when status changes to approved
CREATE OR REPLACE FUNCTION public.trigger_process_saida_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- If status changed to approved, process all items
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao 
       AND NEW.status_aprovacao = 'aprovado' THEN
        PERFORM public.process_saida_items(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_saida_item_process ON public.saida_itens;
CREATE TRIGGER trigger_saida_item_process
    AFTER INSERT ON public.saida_itens
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_process_saida_item();

DROP TRIGGER IF EXISTS trigger_saida_approval_process ON public.saidas;
CREATE TRIGGER trigger_saida_approval_process
    AFTER UPDATE ON public.saidas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_process_saida_approval();