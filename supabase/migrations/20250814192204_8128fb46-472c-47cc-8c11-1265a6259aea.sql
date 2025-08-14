-- Add franquia_id to pending_invites table
ALTER TABLE public.pending_invites ADD COLUMN franquia_id UUID REFERENCES public.franquias(id);

-- Update the process_pending_invite_on_profile function to handle franquia assignment
CREATE OR REPLACE FUNCTION public.process_pending_invite_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- For produtor role, assign franquia if provided
  IF inv.role = 'produtor' AND inv.franquia_id IS NOT NULL THEN
    INSERT INTO public.produtores(user_id, franquia_id)
    VALUES (NEW.user_id, inv.franquia_id)
    ON CONFLICT (user_id) DO UPDATE SET franquia_id = inv.franquia_id;
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
$$;

-- Update the complete_invite_signup function as well
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- For produtor role, assign franquia if provided
  IF inv.role = 'produtor' AND inv.franquia_id IS NOT NULL THEN
    INSERT INTO public.produtores(user_id, franquia_id)
    VALUES (_user_id, inv.franquia_id)
    ON CONFLICT (user_id) DO UPDATE SET franquia_id = inv.franquia_id;
    RAISE LOG 'Added franquia % to produtor %', inv.franquia_id, _user_id;
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