-- Add new page permissions for allocation system
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('ondas-alocacao', 'admin', true, true),
('ondas-alocacao', 'franqueado', true, true),
('ondas-alocacao', 'produtor', false, false),

('alocacao-funcionario', 'admin', true, false),
('alocacao-funcionario', 'franqueado', true, false),
('alocacao-funcionario', 'produtor', false, false),

('gerenciar-posicoes', 'admin', true, true),
('gerenciar-posicoes', 'franqueado', true, true),
('gerenciar-posicoes', 'produtor', false, false);