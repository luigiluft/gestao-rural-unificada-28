-- Limpeza direta das permissões sem ativar triggers problemáticas

-- Primeiro, vamos verificar o user_id do Fernando Moreirra
SELECT user_id, email, nome 
FROM profiles 
WHERE email = 'lucca+2@luft.com.br';

-- Remover permissões individuais usando o user_id diretamente
DELETE FROM user_permissions 
WHERE user_id = '0191fe0a-9c8c-7958-8f8a-bc47d3b48ac8';

-- Remover relação de hierarquia usando o user_id diretamente  
DELETE FROM user_hierarchy 
WHERE child_user_id = '0191fe0a-9c8c-7958-8f8a-bc47d3b48ac8';