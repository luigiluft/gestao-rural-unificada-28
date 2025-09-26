-- Add TMS page permissions for admin and franqueado roles

-- TMS pages permissions for admin role
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('remessas', 'admin', true, true),
('planejamento', 'admin', true, true),
('viagens', 'admin', true, true),
('agenda', 'admin', true, true),
('tracking', 'admin', true, true),
('proof-of-delivery', 'admin', true, true),
('ocorrencias', 'admin', true, true),
('tabelas-frete', 'admin', true, true);

-- TMS pages permissions for franqueado role
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('remessas', 'franqueado', true, true),
('planejamento', 'franqueado', true, true),
('viagens', 'franqueado', true, true),
('agenda', 'franqueado', true, true),
('tracking', 'franqueado', true, true),
('proof-of-delivery', 'franqueado', true, true),
('ocorrencias', 'franqueado', true, true),
('tabelas-frete', 'franqueado', true, true);

-- Update existing transport page permissions for franqueados if they don't have it
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('transporte', 'franqueado', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
can_access = true,
visible_in_menu = true;