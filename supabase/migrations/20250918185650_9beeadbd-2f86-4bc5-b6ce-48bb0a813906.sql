-- Fix signup profile creation: ensure no enum cast issues and proper privileges
-- 1) Recreate the function used by the auth.users trigger with safer settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a minimal profile row for the new user
  -- Avoid any explicit casts to app_role to prevent type resolution issues
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Note: We intentionally do NOT recreate the trigger on auth.users here
-- to avoid modifying reserved schemas. This assumes the existing trigger
-- continues to call public.handle_new_user().