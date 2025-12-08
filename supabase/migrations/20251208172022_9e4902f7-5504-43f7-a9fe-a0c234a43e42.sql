-- Add new permission enum values for configurar-impostos
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'configurar-impostos.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'configurar-impostos.manage';

-- Add page_permissions for configurar-impostos for admin, operador (franqueado) and cliente roles
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('configurar-impostos', 'admin', true, true),
  ('configurar-impostos', 'franqueado', true, true),
  ('configurar-impostos', 'cliente', true, true)
ON CONFLICT DO NOTHING;