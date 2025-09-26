-- Corrigir dados do usuário lucca+10@luft.com.br para aparecer nas subcontas ativas

-- 1. Inserir na hierarquia de usuários (vincular como subconta)
INSERT INTO user_hierarchy (parent_user_id, child_user_id)
VALUES ('a695e2b8-a539-4374-ba04-8c2055c485ea', '06691b92-7c08-48ac-8430-bd9440468f35')
ON CONFLICT DO NOTHING;

-- 2. Atualizar o role do usuário para 'franqueado' conforme especificado no convite
UPDATE profiles 
SET role = 'franqueado'::app_role
WHERE user_id = '06691b92-7c08-48ac-8430-bd9440468f35';

-- 3. Adicionar as permissões especificadas no convite
INSERT INTO user_permissions (user_id, permission)
VALUES 
    ('06691b92-7c08-48ac-8430-bd9440468f35', 'proof-of-delivery.manage'),
    ('06691b92-7c08-48ac-8430-bd9440468f35', 'proof-of-delivery.view')
ON CONFLICT DO NOTHING;