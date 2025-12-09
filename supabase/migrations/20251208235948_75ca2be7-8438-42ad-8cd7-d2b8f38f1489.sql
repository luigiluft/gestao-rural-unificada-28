
-- Habilitar página de depósitos (franquias) para role cliente
UPDATE page_permissions 
SET can_access = true, visible_in_menu = true, updated_at = NOW()
WHERE role = 'cliente' AND page_key = 'franquias';
