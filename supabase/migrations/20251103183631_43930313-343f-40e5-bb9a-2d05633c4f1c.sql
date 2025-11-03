-- Adicionar permissões para a página rastreamento-wms
-- Mesmas permissões que tracking (Rastreamento TMS)

INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('rastreamento-wms', 'admin', true, true),
  ('rastreamento-wms', 'franqueado', true, true)
ON CONFLICT (page_key, role) DO NOTHING;