-- Remover Fernando Moreirra da hierarquia de subcontas
-- Primeiro vamos verificar o user_id do Fernando
-- user_id: c62fa88c-aa81-4f5b-a345-50e223cb4960 (lucca+2@luft.com.br)

-- 1. Remover da hierarquia user_hierarchy
DELETE FROM public.user_hierarchy 
WHERE child_user_id = 'c62fa88c-aa81-4f5b-a345-50e223cb4960';

-- 2. Remover vinculação ao employee_profile
DELETE FROM public.user_employee_profiles 
WHERE user_id = 'c62fa88c-aa81-4f5b-a345-50e223cb4960';

-- 3. Verificar se já existe franquia para Fernando, se não criar uma
INSERT INTO public.franquias (
    master_franqueado_id,
    nome,
    ativo,
    created_at,
    updated_at
)
SELECT 
    'c62fa88c-aa81-4f5b-a345-50e223cb4960',
    'Franquia Fernando Moreirra',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.franquias 
    WHERE master_franqueado_id = 'c62fa88c-aa81-4f5b-a345-50e223cb4960'
);

-- 4. Verificar e garantir que as page_permissions para 'franqueado' estão corretas
-- Inserir permissões básicas para franqueados se não existirem
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
    ('dashboard', 'franqueado', true, true),
    ('entradas', 'franqueado', true, true),
    ('estoque', 'franqueado', true, true),
    ('saidas', 'franqueado', true, true),
    ('inventario', 'franqueado', true, true),
    ('alocacao-pallets', 'franqueado', true, true),
    ('gerenciar-alocacoes', 'franqueado', true, true),
    ('gerenciar-posicoes', 'franqueado', true, true),
    ('separacao', 'franqueado', true, true),
    ('rastreio', 'franqueado', true, true),
    ('relatorios', 'franqueado', true, true),
    ('produtores', 'franqueado', true, true),
    ('subcontas', 'franqueado', true, true),
    ('perfil', 'franqueado', true, true),
    ('suporte', 'franqueado', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET 
    can_access = EXCLUDED.can_access,
    visible_in_menu = EXCLUDED.visible_in_menu;