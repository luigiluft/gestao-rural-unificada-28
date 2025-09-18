-- Fix the validate_produtor_has_franqueado_on_profiles trigger to allow profile creation during invitation
CREATE OR REPLACE FUNCTION public.validate_produtor_has_franqueado_on_profiles()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  has_parent boolean;
  has_pending_invite boolean;
BEGIN
  -- Only validate if we're actually changing the role TO 'produtor'
  -- or if it's an INSERT with role 'produtor'
  IF TG_OP = 'INSERT' THEN
    -- For inserts, check if the new role is 'produtor'
    IF NEW.role = 'produtor' THEN
      -- First check if there's a pending invite for this user's email
      SELECT EXISTS (
        SELECT 1 FROM auth.users u
        JOIN public.pending_invites pi ON LOWER(pi.email) = LOWER(u.email)
        WHERE u.id = NEW.user_id 
        AND pi.used_at IS NULL
        AND pi.role = 'produtor'
      ) INTO has_pending_invite;
      
      -- If there's a pending invite, allow the insert (linkage will be created later)
      IF has_pending_invite THEN
        RETURN NEW;
      END IF;
      
      -- Otherwise, check for existing franqueado linkage
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
$function$;