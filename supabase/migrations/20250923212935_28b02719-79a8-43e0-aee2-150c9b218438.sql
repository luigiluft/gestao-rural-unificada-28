-- Grant permission for franchisees to access freight tables and detail pages
INSERT INTO public.page_permissions (role, page_key, can_access, created_at, updated_at)
VALUES 
  ('franqueado', 'tabelas-frete', true, now(), now()),
  ('franqueado', 'instrucoes', true, now(), now()),
  ('franqueado', 'configuracoes', true, now(), now())
ON CONFLICT (role, page_key) 
DO UPDATE SET can_access = true, updated_at = now();