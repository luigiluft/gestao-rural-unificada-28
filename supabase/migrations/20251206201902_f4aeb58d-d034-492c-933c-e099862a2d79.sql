-- Atualizar permissão para mostrar Empresas no menu para clientes
UPDATE page_permissions 
SET visible_in_menu = true 
WHERE page_key = 'empresas' AND role = 'cliente';

-- Adicionar permissões para a página de fornecedores (se não existirem)
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
    ('fornecedores', 'admin', true, true),
    ('fornecedores', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE 
SET visible_in_menu = true, can_access = true;