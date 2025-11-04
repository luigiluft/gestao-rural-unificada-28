-- Add ctes page permissions for admin and franqueado
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('ctes', 'admin', true, true),
  ('ctes', 'franqueado', true, true)
ON CONFLICT (page_key, role) 
DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;