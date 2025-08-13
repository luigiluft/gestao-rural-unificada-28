-- Create a function to manually process invite after successful signup
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inv RECORD;
  perm permission_code;
BEGIN
  -- Find the pending invite
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF inv IS NULL THEN
    RETURN false;
  END IF;

  -- Link hierarchy if provided
  IF inv.parent_user_id IS NOT NULL THEN
    INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
    VALUES (inv.parent_user_id, _user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign role if provided
  IF inv.role IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (_user_id, inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Grant permissions if provided
  IF inv.permissions IS NOT NULL THEN
    FOREACH perm IN ARRAY inv.permissions LOOP
      INSERT INTO public.user_permissions(user_id, permission)
      VALUES (_user_id, perm)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Mark invite as used
  UPDATE public.pending_invites SET used_at = now() WHERE id = inv.id;
  
  RETURN true;
END;
$function$;