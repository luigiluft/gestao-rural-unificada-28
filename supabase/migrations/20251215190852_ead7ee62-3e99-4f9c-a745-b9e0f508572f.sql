-- Insert page permissions for new TMS pages
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  -- Autônomos page - accessible by admin and cliente
  ('autonomos', 'admin', true, true),
  ('autonomos', 'cliente', true, true),
  -- Oferta de Fretes page - accessible by admin and cliente
  ('oferta-fretes', 'admin', true, true),
  ('oferta-fretes', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;