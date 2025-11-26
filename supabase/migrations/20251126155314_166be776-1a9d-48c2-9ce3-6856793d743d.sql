-- Update page permissions for produtores page (now clientes)
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('produtores', 'admin', true, true),
  ('produtores', 'operador', true, true),
  ('produtores', 'cliente', false, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;