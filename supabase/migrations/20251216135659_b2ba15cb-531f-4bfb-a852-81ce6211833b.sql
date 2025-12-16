-- Fix trigger_process_saida_item function to use correct field name
CREATE OR REPLACE FUNCTION public.trigger_process_saida_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_saida_status TEXT;
BEGIN
    -- Check if the saida is already approved
    SELECT status_aprovacao_produtor INTO v_saida_status
    FROM public.saidas
    WHERE id = NEW.id;
    
    -- If saida is approved, process immediately
    IF v_saida_status = 'aprovado' THEN
        PERFORM public.process_saida_items(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;