-- Migração: Mover roles para tabela profiles (Correção)
-- Fase 1: Adicionar coluna role à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN role app_role;

-- Fase 2: Migrar dados existentes da user_roles para profiles
UPDATE public.profiles 
SET role = (
  SELECT ur.role 
  FROM public.user_roles ur 
  WHERE ur.user_id = profiles.user_id 
  LIMIT 1
);

-- Definir role padrão para usuários sem role definido
UPDATE public.profiles 
SET role = 'produtor'
WHERE role IS NULL;

-- Fase 3: Tornar coluna role obrigatória
ALTER TABLE public.profiles 
ALTER COLUMN role SET NOT NULL;

-- Fase 4: Atualizar função has_role para usar profiles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Função auxiliar para verificar role do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fase 5: Atualizar trigger handle_new_user para incluir role padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'produtor'::app_role
  );
  RETURN NEW;
END;
$$;

-- Fase 6: Remover PRIMEIRO os triggers e DEPOIS as funções relacionados ao user_roles
DROP TRIGGER IF EXISTS trg_validate_produtor_on_roles ON public.user_roles;
DROP TRIGGER IF EXISTS validate_produtor_has_franqueado_trigger ON public.user_roles;
DROP TRIGGER IF EXISTS sync_produtor_on_role_trigger ON public.user_roles;

-- Agora remover as funções
DROP FUNCTION IF EXISTS public.validate_produtor_has_franqueado();
DROP FUNCTION IF EXISTS public.sync_produtor_row_on_role();

-- Criar novos triggers para profiles
CREATE OR REPLACE FUNCTION public.validate_produtor_has_franqueado_on_profiles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_parent boolean;
BEGIN
  IF NEW.role = 'produtor' THEN
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
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_produtor_row_on_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'produtor' THEN
    INSERT INTO public.produtores(user_id) VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se mudou para produtor, inserir
    IF NEW.role = 'produtor' AND (OLD.role IS NULL OR OLD.role != 'produtor') THEN
      INSERT INTO public.produtores(user_id) VALUES (NEW.user_id)
      ON CONFLICT (user_id) DO NOTHING;
    -- Se deixou de ser produtor, remover
    ELSIF OLD.role = 'produtor' AND NEW.role != 'produtor' THEN
      DELETE FROM public.produtores WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER validate_produtor_has_franqueado_on_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_produtor_has_franqueado_on_profiles();

CREATE TRIGGER sync_produtor_on_profiles_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_produtor_row_on_profiles();

-- Fase 7: Atualizar function complete_invite_signup
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

  -- Atribuir role se fornecido (atualizar na tabela profiles)
  IF inv.role IS NOT NULL THEN
    UPDATE public.profiles 
    SET role = inv.role 
    WHERE user_id = _user_id;
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

-- Atualizar function process_pending_invite_on_profile
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

  -- Assign role if provided (update profiles table)
  IF inv.role IS NOT NULL THEN
    UPDATE public.profiles 
    SET role = inv.role 
    WHERE user_id = NEW.user_id;
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

-- Fase 8: Remover RLS policies antigas da tabela user_roles
DROP POLICY IF EXISTS "Admins can manage all user roles via safe function" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.user_roles;

-- Atualizar policy existente para profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = OLD.role); -- Não pode mudar o próprio role

-- Permitir admins gerenciarem roles
CREATE POLICY "Admins can update user roles" ON public.profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fase 9: Limpar tabela user_roles obsoleta
DROP TABLE IF EXISTS public.user_roles CASCADE;