-- Add page permissions for Separação page
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('separacao', 'admin', true, true),
('separacao', 'franqueado', true, true),
('separacao', 'produtor', false, false);