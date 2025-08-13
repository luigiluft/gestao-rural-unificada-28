-- Atualizar a função complete_invite_signup para garantir que funcione corretamente
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  inv RECORD;
  perm permission_code;
BEGIN
  -- Encontrar o convite pendente mais recente para este email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não há convite pendente, retornar false
  IF inv IS NULL THEN
    RAISE LOG 'No pending invite found for email: %', _email;
    RETURN false;
  END IF;

  RAISE LOG 'Processing invite for user % with role %', _user_id, inv.role;

  -- Vincular hierarquia se fornecido
  IF inv.parent_user_id IS NOT NULL THEN
    INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
    VALUES (inv.parent_user_id, _user_id)
    ON CONFLICT DO NOTHING;
    RAISE LOG 'Added hierarchy: parent % -> child %', inv.parent_user_id, _user_id;
  END IF;

  -- Atribuir role se fornecido
  IF inv.role IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (_user_id, inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE LOG 'Added role % to user %', inv.role, _user_id;
  END IF;

  -- Conceder permissões se fornecidas
  IF inv.permissions IS NOT NULL THEN
    FOREACH perm IN ARRAY inv.permissions LOOP
      INSERT INTO public.user_permissions(user_id, permission)
      VALUES (_user_id, perm)
      ON CONFLICT DO NOTHING;
      RAISE LOG 'Added permission % to user %', perm, _user_id;
    END LOOP;
  END IF;

  -- Marcar convite como usado
  UPDATE public.pending_invites SET used_at = now() WHERE id = inv.id;
  RAISE LOG 'Marked invite as used: %', inv.id;
  
  RETURN true;
END;
$$;