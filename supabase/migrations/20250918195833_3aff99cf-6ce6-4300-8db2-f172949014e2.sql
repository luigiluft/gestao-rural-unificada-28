-- Function to safely fetch invite email by token for unauthenticated users
CREATE OR REPLACE FUNCTION public.get_invite_email(_invite_token text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.pending_invites
  WHERE invite_token = _invite_token
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Ensure invite processing ignores expired invites
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  inv RECORD;
  perm permission_code;
  v_nome text;
BEGIN
  -- Find the most recent pending (and not expired) invite for this email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no pending invite, return false
  IF inv IS NULL THEN
    RAISE LOG 'No valid (pending and not expired) invite found for email: %', _email;
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

  -- Link hierarchy if provided
  IF inv.parent_user_id IS NOT NULL THEN
    INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
    VALUES (inv.parent_user_id, _user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- For produtor role, assign franquia if provided
  IF COALESCE(inv.role, 'produtor'::app_role) = 'produtor' AND inv.franquia_id IS NOT NULL THEN
    INSERT INTO public.produtores(user_id, franquia_id)
    VALUES (_user_id, inv.franquia_id)
    ON CONFLICT (user_id) DO UPDATE SET franquia_id = inv.franquia_id;
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