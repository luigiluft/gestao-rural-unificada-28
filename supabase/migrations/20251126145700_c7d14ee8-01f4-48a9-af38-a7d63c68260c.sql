-- Atualizar permissões para página de usuários - operador pode acessar
UPDATE page_permissions 
SET can_access = true, visible_in_menu = true 
WHERE page_key = 'usuarios' AND role = 'operador';

-- Garantir que a permissão existe
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('usuarios', 'operador', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;