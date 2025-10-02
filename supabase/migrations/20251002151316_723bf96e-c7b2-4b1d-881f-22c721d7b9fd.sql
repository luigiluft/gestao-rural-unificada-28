-- Create trigger function for processing saidas on insert
CREATE OR REPLACE FUNCTION public.trigger_process_saida_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Log the trigger execution
    RAISE LOG 'trigger_process_saida_on_insert called for saida_id: %, status_aprovacao_produtor: %', 
        NEW.id, NEW.status_aprovacao_produtor;
    
    -- If saida is approved or doesn't require approval (producer-created), process items immediately
    IF NEW.status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel') THEN
        RAISE LOG 'Processing saida items immediately for saida_id: %', NEW.id;
        PERFORM public.process_saida_items(NEW.id);
    ELSE
        RAISE LOG 'Saida % requires approval, skipping immediate processing', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the AFTER INSERT trigger
DROP TRIGGER IF EXISTS trigger_saida_insert_process ON public.saidas;
CREATE TRIGGER trigger_saida_insert_process
    AFTER INSERT ON public.saidas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_process_saida_on_insert();

-- Log confirmation
DO $$
BEGIN
    RAISE LOG 'Successfully created trigger_saida_insert_process on saidas table';
END $$;