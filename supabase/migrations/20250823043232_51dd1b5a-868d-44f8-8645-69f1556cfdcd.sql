-- Add transporte page permissions for admin and franqueado roles
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('transporte', 'admin', true, true),
  ('transporte', 'franqueado', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;