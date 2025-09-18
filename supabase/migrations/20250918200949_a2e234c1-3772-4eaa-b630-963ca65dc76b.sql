-- Drop and recreate the handle_new_user function with role logic
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  target_role app_role := 'produtor'; -- default role
BEGIN
  -- Look for pending invite for this email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(NEW.email)
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invite exists, use its role
  IF inv IS NOT NULL THEN
    target_role := inv.role;
  END IF;

  -- Insert profile with correct role
  INSERT INTO public.profiles (
    user_id, 
    email, 
    nome, 
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    target_role
  );

  -- If invite exists, process hierarchy and permissions
  IF inv IS NOT NULL THEN
    -- Link hierarchy if provided
    IF inv.parent_user_id IS NOT NULL THEN
      INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
      VALUES (inv.parent_user_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- For produtor role, assign franquia if provided
    IF inv.role = 'produtor' AND inv.franquia_id IS NOT NULL THEN
      INSERT INTO public.produtores(user_id, franquia_id)
      VALUES (NEW.id, inv.franquia_id)
      ON CONFLICT (user_id) DO UPDATE SET franquia_id = inv.franquia_id;
    END IF;

    -- Grant permissions if provided
    IF inv.permissions IS NOT NULL AND array_length(inv.permissions, 1) > 0 THEN
      INSERT INTO public.user_permissions(user_id, permission)
      SELECT NEW.id, unnest(inv.permissions)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Mark invite as used
    UPDATE public.pending_invites 
    SET used_at = now() 
    WHERE id = inv.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();