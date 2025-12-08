-- Adicionar permissões para operador nas novas páginas financeiras
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES
  ('contas-correntes', 'operador', true, true),
  ('movimentacoes-contas', 'operador', true, true),
  ('integracoes-bancos', 'operador', true, true),
  ('aprovacao-pagamentos', 'operador', true, true),
  ('descontos-duplicatas', 'operador', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;

-- Corrigir despesas para cliente
UPDATE public.page_permissions 
SET can_access = true, visible_in_menu = true 
WHERE page_key = 'despesas' AND role = 'cliente';

-- Limpar cache de permissões para forçar recálculo
DELETE FROM public.user_computed_permissions;