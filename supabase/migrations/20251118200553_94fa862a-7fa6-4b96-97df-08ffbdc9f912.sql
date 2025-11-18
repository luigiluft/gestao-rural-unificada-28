-- Atualizar page_permissions de 'clientes' para 'empresas'
UPDATE page_permissions 
SET page_key = 'empresas' 
WHERE page_key = 'clientes';