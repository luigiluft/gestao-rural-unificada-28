-- Atualizar registros existentes de 'franqueado' para 'operador'
UPDATE public.profiles SET role = 'operador' WHERE role = 'franqueado';
UPDATE public.page_permissions SET role = 'operador' WHERE role = 'franqueado';
UPDATE public.permission_templates SET target_role = 'operador' WHERE target_role = 'franqueado';
UPDATE public.user_computed_permissions SET role = 'operador' WHERE role = 'franqueado';

-- Atualizar comentários sobre o enum
COMMENT ON TYPE public.app_role IS 'Roles de usuário: admin, operador (ex-franqueado), cliente (ex-produtor), motorista';

-- Refresh materialized view
REFRESH MATERIALIZED VIEW public.user_franquias_summary;