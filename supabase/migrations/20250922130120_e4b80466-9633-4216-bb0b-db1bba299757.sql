-- Add page permissions for veiculos and motoristas for franqueado role
INSERT INTO public.page_permissions (role, page_key, can_access, visible_in_menu)
VALUES 
  ('franqueado', 'veiculos', true, true),
  ('franqueado', 'motoristas', true, true)
ON CONFLICT (role, page_key) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;