-- Remove tabelas-frete access for franqueado role (should be admin-only)
DELETE FROM public.page_permissions 
WHERE role = 'franqueado' AND page_key = 'tabelas-frete';

-- Ensure admin has access to tabelas-frete
INSERT INTO public.page_permissions (role, page_key, can_access, created_at, updated_at)
VALUES ('admin', 'tabelas-frete', true, now(), now())
ON CONFLICT (role, page_key) 
DO UPDATE SET can_access = true, updated_at = now();