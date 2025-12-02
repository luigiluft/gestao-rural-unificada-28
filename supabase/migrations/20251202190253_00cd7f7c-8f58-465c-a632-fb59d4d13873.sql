-- Add page permissions for atendimento page
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('atendimento', 'admin', true, true),
  ('atendimento', 'operador', true, true),
  ('atendimento', 'cliente', true, true),
  ('atendimento', 'motorista', false, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;