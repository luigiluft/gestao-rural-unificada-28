-- Inserir permissão para página "comprovantes" para o role "franqueado"
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('comprovantes', 'franqueado', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;