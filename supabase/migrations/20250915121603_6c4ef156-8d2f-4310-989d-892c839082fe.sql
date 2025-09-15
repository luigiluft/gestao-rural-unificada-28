-- Adicionar permissões para a página de instruções
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('instrucoes', 'admin', true, true),
('instrucoes', 'franqueado', true, true),
('instrucoes', 'produtor', true, true);