-- Habilitar acesso à página Clientes para o perfil 'produtor' (cliente)
-- Mantém fora do menu para não poluir a navegação
BEGIN;
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('clientes', 'produtor', true, false)
ON CONFLICT (page_key, role) DO UPDATE
  SET can_access = EXCLUDED.can_access,
      visible_in_menu = EXCLUDED.visible_in_menu;
COMMIT;