-- 1. Simplificar handle_new_user trigger - apenas criar profile com role correto
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
  RAISE LOG 'Creating profile for user % with email %', NEW.id, NEW.email;
  
  -- Look for pending invite for this email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(NEW.email)
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invite exists, use its role
  IF inv IS NOT NULL THEN
    target_role := inv.role;
    RAISE LOG 'Found invite for %, using role %', NEW.email, target_role;
  ELSE
    RAISE LOG 'No invite found for %, using default role %', NEW.email, target_role;
  END IF;

  -- Insert profile with correct role - SIMPLIFIED
  INSERT INTO public.profiles (
    user_id, 
    email, 
    nome, 
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    target_role
  );
  
  RAISE LOG 'Profile created for user % with role %', NEW.id, target_role;

  RETURN NEW;
END;
$$;

-- 2. Melhorar complete_invite_signup RPC com validações robustas
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  perm permission_code;
  success boolean := false;
BEGIN
  RAISE LOG 'Starting complete_invite_signup for user % email %', _user_id, _email;
  
  -- Validate inputs
  IF _user_id IS NULL OR _email IS NULL OR _email = '' THEN
    RAISE LOG 'Invalid inputs: user_id=%, email=%', _user_id, _email;
    RETURN false;
  END IF;

  -- Find the most recent unused invite for this email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF inv IS NULL THEN
    RAISE LOG 'No valid invite found for email %', _email;
    RETURN false;
  END IF;
  
  RAISE LOG 'Processing invite % for email % with role %', inv.id, _email, inv.role;

  BEGIN
    -- Update user role if different from current
    UPDATE public.profiles 
    SET role = inv.role,
        updated_at = now()
    WHERE user_id = _user_id 
      AND role != inv.role;
    
    RAISE LOG 'Updated profile role to % for user %', inv.role, _user_id;

    -- Link hierarchy if provided
    IF inv.parent_user_id IS NOT NULL THEN
      INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
      VALUES (inv.parent_user_id, _user_id)
      ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;
      
      RAISE LOG 'Created hierarchy link: parent=% child=%', inv.parent_user_id, _user_id;
    END IF;

    -- For produtor role, assign franquia if provided
    IF inv.role = 'produtor' AND inv.franquia_id IS NOT NULL THEN
      INSERT INTO public.produtores(user_id, franquia_id, ativo)
      VALUES (_user_id, inv.franquia_id, true)
      ON CONFLICT (user_id) DO UPDATE SET 
        franquia_id = inv.franquia_id,
        ativo = true,
        updated_at = now();
      
      RAISE LOG 'Linked produtor % to franquia %', _user_id, inv.franquia_id;
    END IF;

    -- Grant permissions if provided
    IF inv.permissions IS NOT NULL AND array_length(inv.permissions, 1) > 0 THEN
      FOREACH perm IN ARRAY inv.permissions LOOP
        INSERT INTO public.user_permissions(user_id, permission)
        VALUES (_user_id, perm)
        ON CONFLICT (user_id, permission) DO NOTHING;
      END LOOP;
      
      RAISE LOG 'Granted % permissions to user %', array_length(inv.permissions, 1), _user_id;
    END IF;

    -- Mark invite as used
    UPDATE public.pending_invites 
    SET used_at = now(),
        updated_at = now()
    WHERE id = inv.id;
    
    RAISE LOG 'Marked invite % as used', inv.id;
    
    success := true;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error processing invite: %', SQLERRM;
    success := false;
  END;

  RAISE LOG 'complete_invite_signup completed with success=%', success;
  RETURN success;
END;
$$;

-- 3. Adicionar função para verificar status de processamento
CREATE OR REPLACE FUNCTION public.get_invite_email(_invite_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_email text;
BEGIN
  SELECT email INTO invite_email
  FROM public.pending_invites
  WHERE invite_token = _invite_token
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());
    
  RETURN invite_email;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();