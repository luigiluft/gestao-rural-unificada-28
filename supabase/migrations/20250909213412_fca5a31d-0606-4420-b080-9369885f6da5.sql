-- Corrigir função trigger_process_saida_item
-- que está fazendo referência incorreta à coluna 'status_aprovacao' 
-- quando deveria ser 'status_aprovacao_produtor'

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
    SELECT status_aprovacao_produtor INTO v_saida_status
    FROM public.saidas
    WHERE id = NEW.saida_id;
    
    -- If saida is approved, process immediately
    IF v_saida_status = 'aprovado' THEN
        PERFORM public.process_saida_items(NEW.saida_id);
    END IF;
    
    RETURN NEW;
END;
$function$