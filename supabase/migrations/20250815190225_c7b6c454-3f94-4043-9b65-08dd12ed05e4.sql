-- Fix the trigger to only validate when role is actually changing to 'produtor'
CREATE OR REPLACE FUNCTION public.validate_produtor_has_franqueado_on_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  has_parent boolean;
BEGIN
  -- Only validate if we're actually changing the role TO 'produtor'
  -- or if it's an INSERT with role 'produtor'
  IF TG_OP = 'INSERT' THEN
    -- For inserts, check if the new role is 'produtor'
    IF NEW.role = 'produtor' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        WHERE uh.child_user_id = NEW.user_id
      ) INTO has_parent;

      IF NOT has_parent THEN
        RAISE EXCEPTION 'Não é possível atribuir o papel "produtor" sem estar vinculado a um franqueado.';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- For updates, only validate if the role is changing TO 'produtor'
    -- AND it wasn't 'produtor' before
    IF NEW.role = 'produtor' AND (OLD.role IS NULL OR OLD.role != 'produtor') THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        WHERE uh.child_user_id = NEW.user_id
      ) INTO has_parent;

      IF NOT has_parent THEN
        RAISE EXCEPTION 'Não é possível atribuir o papel "produtor" sem estar vinculado a um franqueado.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$