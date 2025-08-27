-- Criar permissões para a nova página alocacao-pallets
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('alocacao-pallets', 'admin', true, true),
('alocacao-pallets', 'franqueado', true, true),
('alocacao-pallets', 'produtor', false, false);

-- Criar permissões para gerenciar-alocacoes também
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('gerenciar-alocacoes', 'admin', true, true),
('gerenciar-alocacoes', 'franqueado', true, true),
('gerenciar-alocacoes', 'produtor', false, false);

-- Opcional: manter as permissões antigas por compatibilidade
-- mas esconder do menu (manter can_access=true para redirecionamento)
UPDATE page_permissions 
SET visible_in_menu = false 
WHERE page_key = 'ondas-alocacao';