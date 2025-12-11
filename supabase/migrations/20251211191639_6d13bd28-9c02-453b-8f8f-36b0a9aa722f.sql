-- Fix sync_storage_position_ocupado trigger function with explicit public. schema references
CREATE OR REPLACE FUNCTION public.sync_storage_position_ocupado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'alocado' THEN
    UPDATE public.storage_positions
    SET ocupado = true, updated_at = NOW()
    WHERE id = NEW.posicao_id;
  END IF;

  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'alocado' AND NEW.status != 'alocado')) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pallet_positions 
      WHERE posicao_id = COALESCE(NEW.posicao_id, OLD.posicao_id) 
      AND status = 'alocado'
      AND id != COALESCE(NEW.id, OLD.id)
    ) THEN
      UPDATE public.storage_positions
      SET ocupado = false, updated_at = NOW()
      WHERE id = COALESCE(NEW.posicao_id, OLD.posicao_id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';