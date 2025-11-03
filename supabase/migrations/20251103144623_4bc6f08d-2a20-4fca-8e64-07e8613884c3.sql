-- Add page_permissions entry for contratos-franquias page
INSERT INTO public.page_permissions (page_key, role, can_access)
VALUES ('contratos-franquias', 'admin', true)
ON CONFLICT (page_key, role) DO UPDATE SET can_access = true;