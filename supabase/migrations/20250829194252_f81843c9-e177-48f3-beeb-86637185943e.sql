-- Corrigir user_id incorretos na tabela employee_profiles

-- 1. Atualizar o perfil do Fernando Moreirra (estava com ID do Lucca)
UPDATE public.employee_profiles 
SET user_id = 'c62fa88c-aa81-4f5b-a345-50e223cb4960' -- Fernando Moreirra
WHERE nome = 'Perfil Auto - Fernando Moreirra' 
AND user_id = '6f6a7a31-a651-4665-ba9b-105eb11fe846'; -- Lucca Luft

-- 2. Atualizar perfis template de franqueado para usar o ID do Fernando
UPDATE public.employee_profiles 
SET user_id = 'c62fa88c-aa81-4f5b-a345-50e223cb4960' -- Fernando Moreirra (master franqueado)
WHERE role = 'franqueado' 
AND is_template = true
AND user_id = '00000000-0000-0000-0000-000000000000'
AND nome IN ('Separação', 'Expedição', 'Recebimento', 'Alocação');

-- 3. Atualizar perfis template de produtor para usar o ID do admin (Lucca)
UPDATE public.employee_profiles 
SET user_id = '6f6a7a31-a651-4665-ba9b-105eb11fe846' -- Lucca Luft (admin)
WHERE role = 'produtor' 
AND is_template = true
AND user_id = '00000000-0000-0000-0000-000000000000'
AND nome IN ('Entradas', 'Estoque', 'Saídas');

-- 4. Verificar se há outros perfis com user_id zerado e corrigir
UPDATE public.employee_profiles 
SET user_id = '6f6a7a31-a651-4665-ba9b-105eb11fe846' -- Usar admin como fallback
WHERE user_id = '00000000-0000-0000-0000-000000000000'
AND is_template = true;