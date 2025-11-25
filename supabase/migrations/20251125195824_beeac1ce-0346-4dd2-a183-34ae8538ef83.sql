-- Fase 1.2: Atualizar todos os registros existentes de 'produtor' para 'cliente'

-- Atualizar profiles
UPDATE public.profiles 
SET role = 'cliente'::app_role 
WHERE role = 'produtor'::app_role;

-- Atualizar page_permissions
UPDATE public.page_permissions 
SET role = 'cliente'::app_role 
WHERE role = 'produtor'::app_role;

-- Atualizar permission_templates
UPDATE public.permission_templates 
SET target_role = 'cliente'::app_role 
WHERE target_role = 'produtor'::app_role;

-- Atualizar user_computed_permissions
UPDATE public.user_computed_permissions 
SET role = 'cliente'::app_role 
WHERE role = 'produtor'::app_role;

-- Atualizar comentários/documentação
COMMENT ON TYPE public.app_role IS 'Roles do sistema: admin, franqueado (operador), cliente, motorista';

-- Refresh da materialized view para refletir as mudanças
REFRESH MATERIALIZED VIEW CONCURRENTLY user_franquias_summary;