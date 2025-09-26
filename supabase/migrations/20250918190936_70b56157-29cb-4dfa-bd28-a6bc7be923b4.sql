-- Fix handle_new_user to satisfy NOT NULL constraints (nome, role) and avoid invite failures
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
BEGIN
  -- Build a safe display name: prefer provided metadata, fallback to email username, then a generic label
  v_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Usuário'
  );

  -- Insert minimal but constraint-compliant profile
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    NEW.id,
    v_nome,
    NEW.email,
    'produtor'::app_role
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Never block auth user creation; log and continue
  RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;