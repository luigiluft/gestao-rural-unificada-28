-- Insert page_permissions for new Financeiro pages
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES
  -- Contas Correntes
  ('contas-correntes', 'admin', true, true),
  ('contas-correntes', 'franqueado', true, true),
  ('contas-correntes', 'cliente', true, true),
  
  -- Movimentações nas Contas
  ('movimentacoes-contas', 'admin', true, true),
  ('movimentacoes-contas', 'franqueado', true, true),
  ('movimentacoes-contas', 'cliente', true, true),
  
  -- Integrações com Bancos
  ('integracoes-bancos', 'admin', true, true),
  ('integracoes-bancos', 'franqueado', true, true),
  ('integracoes-bancos', 'cliente', true, true),
  
  -- Aprovação de Pagamentos
  ('aprovacao-pagamentos', 'admin', true, true),
  ('aprovacao-pagamentos', 'franqueado', true, true),
  ('aprovacao-pagamentos', 'cliente', true, true),
  
  -- Descontos em Duplicatas
  ('descontos-duplicatas', 'admin', true, true),
  ('descontos-duplicatas', 'franqueado', true, true),
  ('descontos-duplicatas', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;