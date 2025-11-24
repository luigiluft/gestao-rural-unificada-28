-- =============================================
-- CORREÇÃO: Eliminar Recursão Infinita RLS
-- =============================================

-- 1. Criar função SECURITY DEFINER que retorna role diretamente
-- Esta função NÃO causa recursão porque não consulta outras tabelas além de profiles
CREATE OR REPLACE FUNCTION public.get_user_role_direct(p_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = p_user_id LIMIT 1
$$;

-- 2. Recriar políticas RLS para page_permissions (eliminar recursão)
DROP POLICY IF EXISTS "Users can read page permissions" ON public.page_permissions;
DROP POLICY IF EXISTS "Admins can manage page permissions" ON public.page_permissions;
DROP POLICY IF EXISTS "Public read page_permissions" ON public.page_permissions;
DROP POLICY IF EXISTS "Admin full access page_permissions" ON public.page_permissions;

-- Política de leitura: aberta para todos autenticados (seguro porque page_permissions não contém dados sensíveis)
CREATE POLICY "Public read page_permissions"
ON public.page_permissions
FOR SELECT
TO authenticated
USING (true);

-- Política de modificação: apenas admins (usando função direta sem recursão)
CREATE POLICY "Admin full access page_permissions"
ON public.page_permissions
FOR ALL
TO authenticated
USING (public.get_user_role_direct(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role_direct(auth.uid()) = 'admin');

-- 3. Simplificar políticas RLS para profiles (prevenir recursão)
DROP POLICY IF EXISTS "Profiles basic view" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;

-- Política: usuários veem apenas seu próprio perfil
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: admins podem ver todos os perfis (usando função direta)
CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_user_role_direct(auth.uid()) = 'admin');

-- Manter políticas INSERT e UPDATE existentes
-- (não precisam ser recriadas se já existem e não causam recursão)