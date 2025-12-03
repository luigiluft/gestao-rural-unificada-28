UPDATE page_permissions 
SET can_access = true, visible_in_menu = true, updated_at = now()
WHERE page_key = 'configuracoes' AND role = 'cliente';