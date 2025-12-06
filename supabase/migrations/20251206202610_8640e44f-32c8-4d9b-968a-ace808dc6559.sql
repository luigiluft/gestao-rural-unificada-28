-- Adicionar permissão de empresas para operador
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('empresas', 'operador', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET can_access = true, visible_in_menu = true;

-- Adicionar permissões de clientes para admin, operador e cliente
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('clientes', 'admin', true, true),
  ('clientes', 'operador', true, true),
  ('clientes', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET can_access = true, visible_in_menu = true;

-- Adicionar permissão de fornecedores para operador (já existe para admin e cliente)
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES ('fornecedores', 'operador', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET can_access = true, visible_in_menu = true;