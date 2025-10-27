-- Parte 2: Inserir permissões de página e atualizar templates
-- Inserir permissões de página para Faturas
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('faturas', 'produtor', true, true),
  ('faturas', 'admin', false, false),
  ('faturas', 'franqueado', false, false)
ON CONFLICT (page_key, role) DO UPDATE
SET 
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;

-- Atualizar templates de permissão existentes para produtores
UPDATE public.permission_templates
SET permissions = array_append(permissions, 'faturas.view'::permission_code)
WHERE target_role = 'produtor' 
  AND NOT ('faturas.view'::permission_code = ANY(permissions));