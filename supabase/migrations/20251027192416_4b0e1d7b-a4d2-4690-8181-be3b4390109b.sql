-- Inserir permissões de página para Financeiro (visível para franqueado)
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('financeiro', 'franqueado', true, true),
  ('financeiro', 'admin', false, false),
  ('financeiro', 'produtor', false, false)
ON CONFLICT (page_key, role) DO UPDATE
SET 
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;

-- Inserir permissões de página para Royalties (visível somente para admin)
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('royalties', 'admin', true, true),
  ('royalties', 'franqueado', false, false),
  ('royalties', 'produtor', false, false)
ON CONFLICT (page_key, role) DO UPDATE
SET 
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;

-- Atualizar templates de permissão existentes para franqueados
UPDATE public.permission_templates
SET permissions = array_append(permissions, 'financeiro.view'::permission_code)
WHERE target_role = 'franqueado' 
  AND NOT ('financeiro.view'::permission_code = ANY(permissions));

-- Atualizar templates de permissão existentes para admins
UPDATE public.permission_templates
SET permissions = array_append(permissions, 'royalties.view'::permission_code)
WHERE target_role = 'admin' 
  AND NOT ('royalties.view'::permission_code = ANY(permissions));