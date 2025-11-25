-- Fase 1 URGENTE: Adicionar índices críticos para melhorar performance

-- Índice para franquia_usuarios (user_id, ativo) - otimiza verificações de permissão
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_user_id_ativo 
ON public.franquia_usuarios(user_id, ativo) 
WHERE ativo = true;

-- Índice para user_permission_templates (user_id) - acelera busca de templates
CREATE INDEX IF NOT EXISTS idx_user_permission_templates_user_id 
ON public.user_permission_templates(user_id);

-- Índice para page_permissions (role, can_access) - otimiza verificação de páginas
CREATE INDEX IF NOT EXISTS idx_page_permissions_role_access 
ON public.page_permissions(role, can_access) 
WHERE can_access = true;

-- Índice para user_hierarchy (child_user_id) - melhora queries de hierarquia
CREATE INDEX IF NOT EXISTS idx_user_hierarchy_child_user_id 
ON public.user_hierarchy(child_user_id);

-- Índice para profiles (user_id, role) - acelera busca de perfis
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role 
ON public.profiles(user_id, role);