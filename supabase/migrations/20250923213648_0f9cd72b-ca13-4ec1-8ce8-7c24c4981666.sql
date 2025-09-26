-- Grant permission for franchisees to access tabela-frete page
INSERT INTO public.page_permissions (role, page_key, can_access, created_at, updated_at)
VALUES ('franqueado', 'tabela-frete', true, now(), now())
ON CONFLICT (role, page_key) 
DO UPDATE SET can_access = true, updated_at = now();