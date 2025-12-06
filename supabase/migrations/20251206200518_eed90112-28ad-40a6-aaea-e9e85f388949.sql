-- Adicionar permissões para as novas páginas de estoque para todos os roles
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
SELECT 'movimentos-estoque', role, can_access, visible_in_menu
FROM page_permissions
WHERE page_key = 'estoque'
ON CONFLICT DO NOTHING;

INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
SELECT 'posicionamento-estoque', role, can_access, visible_in_menu
FROM page_permissions
WHERE page_key = 'estoque'
ON CONFLICT DO NOTHING;