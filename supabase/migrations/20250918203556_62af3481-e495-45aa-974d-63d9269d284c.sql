-- CORREÇÕES DEFINITIVAS PARA SISTEMA DE CADASTRO

-- ============================================================================
-- 1. FUNÇÃO DE DIAGNÓSTICO PARA TROUBLESHOOTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.diagnose_user_signup(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{}';
    auth_user_record RECORD;
    profile_record RECORD;
    invite_record RECORD;
    hierarchy_records RECORD[];
    permissions_records RECORD[];
    produtor_record RECORD;
BEGIN
    RAISE LOG 'Starting diagnosis for email: %', _email;
    
    -- Check auth.users
    SELECT id, email, email_confirmed_at, created_at, encrypted_password IS NOT NULL as has_password
    INTO auth_user_record
    FROM auth.users 
    WHERE email = _email;
    
    result := jsonb_set(result, '{auth_user}', to_jsonb(auth_user_record));
    
    -- Check pending invite
    SELECT id, email, role, parent_user_id, franquia_id, permissions, used_at, expires_at, created_at
    INTO invite_record
    FROM public.pending_invites
    WHERE lower(email) = lower(_email)
    ORDER BY created_at DESC
    LIMIT 1;
    
    result := jsonb_set(result, '{pending_invite}', to_jsonb(invite_record));
    
    -- Check profile
    IF auth_user_record.id IS NOT NULL THEN
        SELECT user_id, email, nome, role, created_at
        INTO profile_record
        FROM public.profiles
        WHERE user_id = auth_user_record.id;
        
        result := jsonb_set(result, '{profile}', to_jsonb(profile_record));
        
        -- Check hierarchy
        SELECT array_agg(
            json_build_object(
                'parent_user_id', uh.parent_user_id,
                'child_user_id', uh.child_user_id,
                'parent_name', pp.nome,
                'parent_role', pp.role
            )
        ) INTO hierarchy_records
        FROM public.user_hierarchy uh
        LEFT JOIN public.profiles pp ON pp.user_id = uh.parent_user_id
        WHERE uh.child_user_id = auth_user_record.id;
        
        result := jsonb_set(result, '{hierarchy}', to_jsonb(hierarchy_records));
        
        -- Check permissions
        SELECT array_agg(permission) INTO permissions_records
        FROM public.user_permissions
        WHERE user_id = auth_user_record.id;
        
        result := jsonb_set(result, '{permissions}', to_jsonb(permissions_records));
        
        -- Check produtor record if role is produtor
        IF profile_record.role = 'produtor' THEN
            SELECT user_id, franquia_id, ativo
            INTO produtor_record
            FROM public.produtores
            WHERE user_id = auth_user_record.id;
            
            result := jsonb_set(result, '{produtor}', to_jsonb(produtor_record));
        END IF;
    END IF;
    
    RAISE LOG 'Diagnosis completed for %: %', _email, result;
    RETURN result;
END;
$$;

-- ============================================================================
-- 2. MELHORAR complete_invite_signup COM TRATAMENTO ROBUSTO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_invite_signup(_user_id uuid, _email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
  perm permission_code;
  result jsonb := '{}';
  operations_performed text[] := '{}';
BEGIN
  RAISE LOG '=== Starting complete_invite_signup for user % email % ===', _user_id, _email;
  
  -- Validate inputs
  IF _user_id IS NULL OR _email IS NULL OR _email = '' THEN
    result := jsonb_build_object(
      'success', false,
      'error', 'Invalid inputs: user_id or email is null/empty',
      'operations_performed', operations_performed
    );
    RAISE LOG 'Invalid inputs: user_id=%, email=%', _user_id, _email;
    RETURN result;
  END IF;

  -- Find the most recent valid invite
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF inv IS NULL THEN
    result := jsonb_build_object(
      'success', false,
      'error', 'No valid invite found',
      'operations_performed', operations_performed
    );
    RAISE LOG 'No valid invite found for email %', _email;
    RETURN result;
  END IF;
  
  RAISE LOG 'Found invite: id=%, role=%, parent_user_id=%, franquia_id=%', 
    inv.id, inv.role, inv.parent_user_id, inv.franquia_id;

  BEGIN
    -- Update user role if different from current
    UPDATE public.profiles 
    SET role = inv.role,
        updated_at = now()
    WHERE user_id = _user_id 
      AND (role IS NULL OR role != inv.role);
    
    IF FOUND THEN
      operations_performed := array_append(operations_performed, 'updated_profile_role');
      RAISE LOG 'Updated profile role to % for user %', inv.role, _user_id;
    END IF;

    -- Link hierarchy if provided
    IF inv.parent_user_id IS NOT NULL THEN
      INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
      VALUES (inv.parent_user_id, _user_id)
      ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;
      
      IF FOUND THEN
        operations_performed := array_append(operations_performed, 'created_hierarchy');
        RAISE LOG 'Created hierarchy: parent=% child=%', inv.parent_user_id, _user_id;
      END IF;
    END IF;

    -- For produtor role, assign franquia if provided
    IF inv.role = 'produtor' AND inv.franquia_id IS NOT NULL THEN
      INSERT INTO public.produtores(user_id, franquia_id, ativo)
      VALUES (_user_id, inv.franquia_id, true)
      ON CONFLICT (user_id) DO UPDATE SET 
        franquia_id = inv.franquia_id,
        ativo = true,
        updated_at = now();
      
      operations_performed := array_append(operations_performed, 'linked_to_franquia');
      RAISE LOG 'Linked produtor % to franquia %', _user_id, inv.franquia_id;
    END IF;

    -- Grant permissions if provided
    IF inv.permissions IS NOT NULL AND array_length(inv.permissions, 1) > 0 THEN
      FOREACH perm IN ARRAY inv.permissions LOOP
        INSERT INTO public.user_permissions(user_id, permission)
        VALUES (_user_id, perm)
        ON CONFLICT (user_id, permission) DO NOTHING;
      END LOOP;
      
      operations_performed := array_append(operations_performed, 'granted_permissions');
      RAISE LOG 'Granted % permissions to user %', array_length(inv.permissions, 1), _user_id;
    END IF;

    -- Mark invite as used
    UPDATE public.pending_invites 
    SET used_at = now(),
        updated_at = now()
    WHERE id = inv.id;
    
    operations_performed := array_append(operations_performed, 'marked_invite_used');
    RAISE LOG 'Marked invite % as used', inv.id;
    
    result := jsonb_build_object(
      'success', true,
      'invite_id', inv.id,
      'role_assigned', inv.role,
      'operations_performed', operations_performed
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'ERROR in complete_invite_signup: %', SQLERRM;
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'operations_performed', operations_performed
    );
  END;

  RAISE LOG '=== complete_invite_signup completed: % ===', result;
  RETURN result;
END;
$$;

-- ============================================================================
-- 3. MODIFICAR validate_produtor_has_franqueado PARA SER INVITE-AWARE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_produtor_has_franqueado_on_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_parent boolean;
  has_pending_invite boolean;
  is_invite_processing boolean;
  session_context text;
BEGIN
  -- Only validate if we're actually changing the role TO 'produtor'
  IF TG_OP = 'INSERT' THEN
    -- For inserts, check if the new role is 'produtor'
    IF NEW.role = 'produtor' THEN
      -- Check if this is happening during invite processing
      -- We use a session variable or check for pending invite to detect this
      SELECT current_setting('app.processing_invite', true) INTO session_context;
      is_invite_processing := (session_context = 'true');
      
      -- If not during invite processing, check for pending invite
      IF NOT is_invite_processing THEN
        SELECT EXISTS (
          SELECT 1 FROM auth.users u
          JOIN public.pending_invites pi ON LOWER(pi.email) = LOWER(u.email)
          WHERE u.id = NEW.user_id 
          AND pi.used_at IS NULL
          AND pi.role = 'produtor'
          AND (pi.expires_at IS NULL OR pi.expires_at > now())
        ) INTO has_pending_invite;
        
        -- If there's a pending invite, allow the insert (linkage will be created later)
        IF has_pending_invite THEN
          RAISE LOG 'Allowing produtor creation due to pending invite for user %', NEW.user_id;
          RETURN NEW;
        END IF;
      ELSE
        -- During invite processing, always allow
        RAISE LOG 'Allowing produtor creation during invite processing for user %', NEW.user_id;
        RETURN NEW;
      END IF;
      
      -- Otherwise, check for existing franqueado linkage
      SELECT EXISTS (
        SELECT 1
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        WHERE uh.child_user_id = NEW.user_id
      ) INTO has_parent;

      IF NOT has_parent THEN
        RAISE EXCEPTION 'Não é possível atribuir o papel "produtor" sem estar vinculado a um franqueado.';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- For updates, only validate if the role is changing TO 'produtor'
    -- AND it wasn't 'produtor' before
    IF NEW.role = 'produtor' AND (OLD.role IS NULL OR OLD.role != 'produtor') THEN
      -- Same logic as INSERT
      SELECT current_setting('app.processing_invite', true) INTO session_context;
      is_invite_processing := (session_context = 'true');
      
      IF NOT is_invite_processing THEN
        SELECT EXISTS (
          SELECT 1 FROM auth.users u
          JOIN public.pending_invites pi ON LOWER(pi.email) = LOWER(u.email)
          WHERE u.id = NEW.user_id 
          AND pi.used_at IS NULL
          AND pi.role = 'produtor'
          AND (pi.expires_at IS NULL OR pi.expires_at > now())
        ) INTO has_pending_invite;
        
        IF has_pending_invite THEN
          RAISE LOG 'Allowing produtor role change due to pending invite for user %', NEW.user_id;
          RETURN NEW;
        END IF;
      ELSE
        RAISE LOG 'Allowing produtor role change during invite processing for user %', NEW.user_id;
        RETURN NEW;
      END IF;
      
      SELECT EXISTS (
        SELECT 1
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        WHERE uh.child_user_id = NEW.user_id
      ) INTO has_parent;

      IF NOT has_parent THEN
        RAISE EXCEPTION 'Não é possível atribuir o papel "produtor" sem estar vinculado a um franqueado.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. RECRIAR handle_new_user PARA PROCESSAMENTO COMPLETO E INTEGRADO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
  target_role app_role := 'produtor'; -- default role
  invite_result jsonb;
  has_valid_invite boolean := false;
BEGIN
  RAISE LOG '=== Creating profile for user % with email % ===', NEW.id, NEW.email;
  
  -- Look for pending invite for this email
  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(NEW.email)
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invite exists, use its role and mark that we have a valid invite
  IF inv IS NOT NULL THEN
    target_role := inv.role;
    has_valid_invite := true;
    RAISE LOG 'Found invite for %, using role %, will process invite after profile creation', NEW.email, target_role;
  ELSE
    RAISE LOG 'No invite found for %, using default role %', NEW.email, target_role;
  END IF;

  -- Set session variable to indicate we're processing an invite
  IF has_valid_invite THEN
    PERFORM set_config('app.processing_invite', 'true', true);
  END IF;

  BEGIN
    -- Insert profile with correct role
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

    -- If we have a valid invite, process it immediately
    IF has_valid_invite THEN
      RAISE LOG 'Processing invite immediately for user %', NEW.id;
      
      -- Call complete_invite_signup to handle hierarchy, permissions, etc.
      SELECT public.complete_invite_signup(NEW.id, NEW.email) INTO invite_result;
      
      IF (invite_result->>'success')::boolean THEN
        RAISE LOG 'Invite processed successfully: %', invite_result;
      ELSE
        RAISE LOG 'Invite processing failed: %', invite_result;
        -- Don't raise exception here, profile is still created
      END IF;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'ERROR in handle_new_user: %', SQLERRM;
    -- Reset session variable
    PERFORM set_config('app.processing_invite', 'false', true);
    RAISE;
  END;

  -- Reset session variable
  PERFORM set_config('app.processing_invite', 'false', true);
  
  RAISE LOG '=== handle_new_user completed for user % ===', NEW.id;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. ADICIONAR RLS POLICY PARA LEITURA DE PENDING_INVITES POR TRIGGERS
-- ============================================================================

-- Ensure triggers can read pending_invites
CREATE POLICY IF NOT EXISTS "Allow system functions to read invites"
ON public.pending_invites
FOR SELECT
TO authenticated
USING (true); -- SECURITY DEFINER functions will have elevated privileges anyway

-- ============================================================================
-- 6. LOGS E COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automaticamente cria perfil e processa convites pendentes para novos usuários';
COMMENT ON FUNCTION public.complete_invite_signup(uuid, text) IS 'Processa convite pendente configurando hierarquia, permissões e vínculos';
COMMENT ON FUNCTION public.validate_produtor_has_franqueado_on_profiles() IS 'Valida que produtores tenham franqueado, mas permite criação durante processamento de convite';
COMMENT ON FUNCTION public.diagnose_user_signup(text) IS 'Função de diagnóstico para verificar estado completo do cadastro de usuário';

RAISE LOG 'SISTEMA DE CADASTRO: Todas as correções definitivas foram aplicadas com sucesso!';