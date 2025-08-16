-- Temporarily disable the trigger to fix data inconsistencies
DROP TRIGGER IF EXISTS entrada_status_change_trigger ON public.entradas;

-- Fix inconsistent data
UPDATE public.entradas 
SET status_aprovacao = 'confirmado'
WHERE status = 'confirmado' 
  AND status_aprovacao != 'confirmado';

-- Recreate the trigger with better null handling
CREATE OR REPLACE FUNCTION public.log_entrada_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Só registra se o status_aprovacao mudou
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao THEN
        INSERT INTO public.entrada_status_historico (
            entrada_id,
            status_anterior,
            status_novo,
            user_id,
            observacoes
        ) VALUES (
            NEW.id,
            OLD.status_aprovacao,
            NEW.status_aprovacao,
            COALESCE(auth.uid(), NEW.user_id), -- Use entrada user_id if no authenticated user
            CASE 
                WHEN NEW.status_aprovacao = 'conferencia_completa' AND NEW.observacoes_franqueado IS NOT NULL 
                THEN NEW.observacoes_franqueado
                ELSE NULL
            END
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER entrada_status_change_trigger
    AFTER UPDATE ON public.entradas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_entrada_status_change();