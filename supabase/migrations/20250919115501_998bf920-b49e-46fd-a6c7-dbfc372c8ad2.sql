-- Correções para processar convites órfãos
-- 1. Corrigir manualmente o convite específico lucca+3@luft.com.br

-- Primeiro, vamos corrigir o role conflict
UPDATE public.profiles 
SET role = 'franqueado' 
WHERE email = 'lucca+3@luft.com.br' AND role = 'produtor';

-- Processar o convite órfão manualmente
DO $$
DECLARE
  invite_record RECORD;
  profile_record RECORD;
  perm permission_code;
BEGIN
  -- Buscar o convite pendente
  SELECT * INTO invite_record
  FROM public.pending_invites
  WHERE lower(email) = lower('lucca+3@luft.com.br')
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- Buscar o perfil do usuário
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE lower(email) = lower('lucca+3@luft.com.br');

  IF invite_record.id IS NOT NULL AND profile_record.user_id IS NOT NULL THEN
    RAISE LOG 'Processando convite órfão: % para usuário: %', invite_record.id, profile_record.user_id;

    -- Criar hierarquia se necessário
    IF invite_record.parent_user_id IS NOT NULL THEN
      INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
      VALUES (invite_record.parent_user_id, profile_record.user_id)
      ON CONFLICT DO NOTHING;
      RAISE LOG 'Hierarquia criada: parent=% child=%', invite_record.parent_user_id, profile_record.user_id;
    END IF;

    -- Atualizar role se necessário
    IF invite_record.role IS NOT NULL AND profile_record.role != invite_record.role THEN
      UPDATE public.profiles 
      SET role = invite_record.role 
      WHERE user_id = profile_record.user_id;
      RAISE LOG 'Role atualizado para: %', invite_record.role;
    END IF;

    -- Atribuir permissões
    IF invite_record.permissions IS NOT NULL THEN
      FOREACH perm IN ARRAY invite_record.permissions LOOP
        INSERT INTO public.user_permissions(user_id, permission)
        VALUES (profile_record.user_id, perm)
        ON CONFLICT DO NOTHING;
        RAISE LOG 'Permissão atribuída: %', perm;
      END LOOP;
    END IF;

    -- Para franqueado, criar ou vincular franquia
    IF invite_record.role = 'franqueado' AND invite_record.franquia_id IS NOT NULL THEN
      UPDATE public.franquias
      SET master_franqueado_id = profile_record.user_id
      WHERE id = invite_record.franquia_id;
      RAISE LOG 'Franquia vinculada: %', invite_record.franquia_id;
    END IF;

    -- Para produtor, vincular à franquia
    IF invite_record.role = 'produtor' AND invite_record.franquia_id IS NOT NULL THEN
      INSERT INTO public.produtores(user_id, franquia_id)
      VALUES (profile_record.user_id, invite_record.franquia_id)
      ON CONFLICT (user_id) DO UPDATE SET franquia_id = invite_record.franquia_id;
      RAISE LOG 'Produtor vinculado à franquia: %', invite_record.franquia_id;
    END IF;

    -- Marcar convite como usado
    UPDATE public.pending_invites 
    SET used_at = now() 
    WHERE id = invite_record.id;
    RAISE LOG 'Convite marcado como usado: %', invite_record.id;

  ELSE
    RAISE LOG 'Convite ou perfil não encontrado para: lucca+3@luft.com.br';
  END IF;
END $$;

-- 2. Melhorar a função complete_invite_signup com melhor logging e tratamento de erros
CREATE OR REPLACE FUNCTION public.complete_invite_signup(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  profile_record RECORD;
  perm permission_code;
  result jsonb;
  error_message text;
  operations_performed text[] := '{}';
BEGIN
  -- Log início da operação
  RAISE LOG 'complete_invite_signup: Iniciando processamento para email=%', _email;
  
  -- Buscar convite pendente
  SELECT * INTO invite_record
  FROM public.pending_invites
  WHERE lower(email) = lower(_email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record.id IS NULL THEN
    RAISE LOG 'complete_invite_signup: Nenhum convite pendente encontrado para %', _email;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhum convite pendente encontrado',
      'email', _email
    );
  END IF;

  RAISE LOG 'complete_invite_signup: Convite encontrado id=%, role=%, parent_user_id=%', 
    invite_record.id, invite_record.role, invite_record.parent_user_id;

  -- Buscar perfil do usuário
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE lower(email) = lower(_email);

  IF profile_record.user_id IS NULL THEN
    RAISE LOG 'complete_invite_signup: Perfil não encontrado para %', _email;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil de usuário não encontrado',
      'email', _email
    );
  END IF;

  RAISE LOG 'complete_invite_signup: Perfil encontrado user_id=%, current_role=%', 
    profile_record.user_id, profile_record.role;

  BEGIN
    -- Criar hierarquia se necessário
    IF invite_record.parent_user_id IS NOT NULL THEN
      INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
      VALUES (invite_record.parent_user_id, profile_record.user_id)
      ON CONFLICT DO NOTHING;
      
      operations_performed := operations_performed || 'hierarchy_created';
      RAISE LOG 'complete_invite_signup: Hierarquia criada parent=%, child=%', 
        invite_record.parent_user_id, profile_record.user_id;
    END IF;

    -- Atualizar role se necessário
    IF invite_record.role IS NOT NULL THEN
      UPDATE public.profiles 
      SET role = invite_record.role 
      WHERE user_id = profile_record.user_id;
      
      operations_performed := operations_performed || 'role_updated';
      RAISE LOG 'complete_invite_signup: Role atualizado para %', invite_record.role;
    END IF;

    -- Atribuir permissões
    IF invite_record.permissions IS NOT NULL AND array_length(invite_record.permissions, 1) > 0 THEN
      FOREACH perm IN ARRAY invite_record.permissions LOOP
        BEGIN
          INSERT INTO public.user_permissions(user_id, permission)
          VALUES (profile_record.user_id, perm)
          ON CONFLICT DO NOTHING;
          
          RAISE LOG 'complete_invite_signup: Permissão atribuída %', perm;
        EXCEPTION WHEN OTHERS THEN
          RAISE LOG 'complete_invite_signup: Erro ao atribuir permissão %: %', perm, SQLERRM;
        END;
      END LOOP;
      operations_performed := operations_performed || 'permissions_assigned';
    END IF;

    -- Para franqueado, vincular franquia
    IF invite_record.role = 'franqueado' AND invite_record.franquia_id IS NOT NULL THEN
      UPDATE public.franquias
      SET master_franqueado_id = profile_record.user_id
      WHERE id = invite_record.franquia_id;
      
      operations_performed := operations_performed || 'franquia_linked';
      RAISE LOG 'complete_invite_signup: Franquia vinculada %', invite_record.franquia_id;
    END IF;

    -- Para produtor, vincular à franquia
    IF invite_record.role = 'produtor' AND invite_record.franquia_id IS NOT NULL THEN
      INSERT INTO public.produtores(user_id, franquia_id)
      VALUES (profile_record.user_id, invite_record.franquia_id)
      ON CONFLICT (user_id) DO UPDATE SET franquia_id = invite_record.franquia_id;
      
      operations_performed := operations_performed || 'produtor_linked';
      RAISE LOG 'complete_invite_signup: Produtor vinculado à franquia %', invite_record.franquia_id;
    END IF;

    -- Marcar convite como usado
    UPDATE public.pending_invites 
    SET used_at = now() 
    WHERE id = invite_record.id;
    
    operations_performed := operations_performed || 'invite_marked_used';
    RAISE LOG 'complete_invite_signup: Convite marcado como usado %', invite_record.id;

    result := jsonb_build_object(
      'success', true,
      'message', 'Convite processado com sucesso',
      'email', _email,
      'user_id', profile_record.user_id,
      'role', invite_record.role,
      'operations_performed', operations_performed,
      'invite_id', invite_record.id
    );

    RAISE LOG 'complete_invite_signup: Processamento concluído com sucesso para %', _email;
    RETURN result;

  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE LOG 'complete_invite_signup: ERRO durante processamento: %', error_message;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', error_message,
      'email', _email,
      'operations_performed', operations_performed
    );
  END;
END;
$$;

-- 3. Criar função para processar convites órfãos em lote
CREATE OR REPLACE FUNCTION public.process_orphaned_invites()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  orphaned_invite RECORD;
  result_summary jsonb;
  processed_count integer := 0;
  error_count integer := 0;
  results jsonb[] := '{}';
  process_result jsonb;
BEGIN
  RAISE LOG 'process_orphaned_invites: Iniciando processamento de convites órfãos';

  -- Buscar convites órfãos (não usados mas com perfil existente)
  FOR orphaned_invite IN
    SELECT pi.email, pi.id as invite_id, pi.created_at, pi.role
    FROM public.pending_invites pi
    JOIN public.profiles p ON lower(p.email) = lower(pi.email)
    WHERE pi.used_at IS NULL
      AND pi.created_at < now() - interval '1 hour' -- Pelo menos 1 hora antigo
    ORDER BY pi.created_at ASC
  LOOP
    RAISE LOG 'process_orphaned_invites: Processando convite órfão email=%, invite_id=%', 
      orphaned_invite.email, orphaned_invite.invite_id;

    -- Processar o convite órfão
    SELECT public.complete_invite_signup(orphaned_invite.email) INTO process_result;
    
    results := results || process_result;

    IF (process_result->>'success')::boolean THEN
      processed_count := processed_count + 1;
      RAISE LOG 'process_orphaned_invites: Convite órfão processado com sucesso: %', orphaned_invite.email;
    ELSE
      error_count := error_count + 1;
      RAISE LOG 'process_orphaned_invites: Erro ao processar convite órfão: % - %', 
        orphaned_invite.email, process_result->>'error';
    END IF;
  END LOOP;

  result_summary := jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'error_count', error_count,
    'total_found', processed_count + error_count,
    'timestamp', now(),
    'details', results
  );

  RAISE LOG 'process_orphaned_invites: Processamento concluído. Processados: %, Erros: %', 
    processed_count, error_count;

  RETURN result_summary;
END;
$$;

-- 4. Melhorar handle_new_user para garantir processamento de convites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  signup_result jsonb;
BEGIN
  RAISE LOG 'handle_new_user: Processando novo usuário id=%, email=%', NEW.id, NEW.email;

  -- Criar perfil básico
  INSERT INTO public.profiles (user_id, email, nome, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', 'Usuário'),
    'produtor'  -- Role padrão, será sobrescrito pelo convite se existir
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = NEW.email,
    nome = COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', profiles.nome);

  RAISE LOG 'handle_new_user: Perfil criado/atualizado para %', NEW.email;

  -- Processar convite se existir (com delay para garantir que o perfil foi commitado)
  PERFORM pg_sleep(0.1);
  
  SELECT public.complete_invite_signup(NEW.email) INTO signup_result;
  
  IF (signup_result->>'success')::boolean THEN
    RAISE LOG 'handle_new_user: Convite processado com sucesso para %', NEW.email;
  ELSE
    RAISE LOG 'handle_new_user: Aviso - Não foi possível processar convite para %: %', 
      NEW.email, signup_result->>'error';
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user: ERRO durante processamento de %: %', NEW.email, SQLERRM;
  -- Não falhar o signup mesmo se houver erro no processamento do convite
  RETURN NEW;
END;
$$;