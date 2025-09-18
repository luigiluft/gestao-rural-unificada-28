-- Fix complete_invite_signup to ensure profile creation with UPSERT
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  inv RECORD;
  perm permission_code;
  v_nome text;
BEGIN
  -- Find the most recent pending invite for this email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no pending invite, return false
  IF inv IS NULL THEN
    RAISE LOG 'No pending invite found for email: %', _email;
    RETURN false;
  END IF;

  RAISE LOG 'Processing invite for user % with role %', _user_id, inv.role;

  -- Create safe display name
  v_nome := COALESCE(
    split_part(_email, '@', 1),
    'Usuário'
  );

  -- UPSERT profile to ensure it exists with invite data
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    _user_id,
    v_nome,
    _email,
    COALESCE(inv.role, 'produtor'::app_role)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = COALESCE(inv.role, profiles.role),
    nome = COALESCE(v_nome, profiles.nome),
    email = COALESCE(_email, profiles.email);

  RAISE LOG 'Profile created/updated for user % with role %', _user_id, COALESCE(inv.role, 'produtor');

  -- Link hierarchy if provided
  IF inv.parent_user_id IS NOT NULL THEN
    INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
    VALUES (inv.parent_user_id, _user_id)
    ON CONFLICT DO NOTHING;
    RAISE LOG 'Added hierarchy: parent % -> child %', inv.parent_user_id, _user_id;
  END IF;

  -- For produtor role, assign franquia if provided
  IF COALESCE(inv.role, 'produtor'::app_role) = 'produtor' AND inv.franquia_id IS NOT NULL THEN
    INSERT INTO public.produtores(user_id, franquia_id)
    VALUES (_user_id, inv.franquia_id)
    ON CONFLICT (user_id) DO UPDATE SET franquia_id = inv.franquia_id;
    RAISE LOG 'Added franquia % to produtor %', inv.franquia_id, _user_id;
  END IF;

  -- Grant permissions if provided
  IF inv.permissions IS NOT NULL THEN
    FOREACH perm IN ARRAY inv.permissions LOOP
      INSERT INTO public.user_permissions(user_id, permission)
      VALUES (_user_id, perm)
      ON CONFLICT DO NOTHING;
      RAISE LOG 'Added permission % to user %', perm, _user_id;
    END LOOP;
  END IF;

  -- Mark invite as used
  UPDATE public.pending_invites SET used_at = now() WHERE id = inv.id;
  RAISE LOG 'Marked invite as used: %', inv.id;
  
  RETURN true;
END;
$$;