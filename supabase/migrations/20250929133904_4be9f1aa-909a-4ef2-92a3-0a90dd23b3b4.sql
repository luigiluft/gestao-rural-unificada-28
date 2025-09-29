-- Inserir permissões para a página de divergências
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('divergencias', 'admin', true, true),
  ('divergencias', 'franqueado', true, true),
  ('divergencias', 'produtor', false, false),
  ('divergencias', 'motorista', false, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;