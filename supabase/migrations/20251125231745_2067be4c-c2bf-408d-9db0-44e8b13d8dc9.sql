-- Add page permissions for Locais de Entrega
-- For admin role
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('locais-entrega', 'admin', true, true)
ON CONFLICT (page_key, role) DO UPDATE 
SET 
  can_access = true,
  visible_in_menu = true,
  updated_at = now();

-- For cliente role
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('locais-entrega', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE 
SET 
  can_access = true,
  visible_in_menu = true,
  updated_at = now();

COMMENT ON TABLE public.page_permissions IS 'Added locais-entrega permissions for admin and cliente roles';