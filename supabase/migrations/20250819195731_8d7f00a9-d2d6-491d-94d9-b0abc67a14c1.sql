-- Add page permissions for Inventário page
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('inventario', 'admin', true, true),
('inventario', 'franqueado', true, true),
('inventario', 'produtor', false, false);