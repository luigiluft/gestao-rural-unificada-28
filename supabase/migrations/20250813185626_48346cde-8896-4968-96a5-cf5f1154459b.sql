-- Update the trigger function to not auto-process invites on profile creation
-- This ensures users must complete the signup process before becoming active
CREATE OR REPLACE FUNCTION public.process_pending_invite_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inv RECORD;
  perm permission_code;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only process invites if this is NOT an auto-created profile from invitation
  -- Check if there's a valid session with confirmed email (meaning user completed signup)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = NEW.user_id 
    AND email_confirmed_at IS NOT NULL
    AND encrypted_password IS NOT NULL
  ) THEN
    -- User hasn't completed signup yet, don't process invite
    RETURN NEW;
  END IF;

  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(NEW.email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF inv IS NULL THEN
    RETURN NEW;
  END IF;

  -- Link hierarchy if provided
  IF inv.parent_user_id IS NOT NULL THEN
    INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
    VALUES (inv.parent_user_id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign role if provided
  IF inv.role IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.user_id, inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Grant permissions if provided
  IF inv.permissions IS NOT NULL THEN
    FOREACH perm IN ARRAY inv.permissions LOOP
      INSERT INTO public.user_permissions(user_id, permission)
      VALUES (NEW.user_id, perm)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  UPDATE public.pending_invites SET used_at = now() WHERE id = inv.id;
  RETURN NEW;
END;
$function$;