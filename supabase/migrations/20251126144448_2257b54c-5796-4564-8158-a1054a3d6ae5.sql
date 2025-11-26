-- Adicionar permissões para as novas páginas do ERP
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  -- Receitas
  ('receitas', 'admin', true, true),
  ('receitas', 'operador', true, true),
  ('receitas', 'cliente', true, true),
  ('receitas', 'motorista', false, false),
  
  -- Despesas
  ('despesas', 'admin', true, true),
  ('despesas', 'operador', true, true),
  ('despesas', 'cliente', false, false),
  ('despesas', 'motorista', false, false),
  
  -- Caixa (Fluxo de Caixa)
  ('caixa', 'admin', true, true),
  ('caixa', 'operador', true, true),
  ('caixa', 'cliente', false, false),
  ('caixa', 'motorista', false, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;