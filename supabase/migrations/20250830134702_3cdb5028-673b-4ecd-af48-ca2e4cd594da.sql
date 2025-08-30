-- Deletar registro incorreto da user_hierarchy
-- Fernando Moreirra não deve ser child do admin Lucca
DELETE FROM public.user_hierarchy 
WHERE id = 'e62398ad-7ddd-4d29-97bb-f68bccb2659f'
AND parent_user_id = '6f6a7a31-a651-4665-ba9b-105eb11fe846' -- Lucca (admin)
AND child_user_id = 'a695e2b8-a539-4374-ba04-8c2055c485ea'; -- Fernando (franqueado)

-- Verificar se restaram registros incorretos
-- (Esta query é apenas para verificação, não altera dados)
SELECT * FROM public.user_hierarchy 
WHERE child_user_id = 'a695e2b8-a539-4374-ba04-8c2055c485ea';