-- Permitir acesso à página de configurações para franqueados
UPDATE page_permissions 
SET can_access = true, visible_in_menu = true 
WHERE page_key = 'configuracoes' AND role = 'franqueado';

-- Verificar o resultado
SELECT page_key, role, can_access, visible_in_menu 
FROM page_permissions 
WHERE page_key = 'configuracoes' 
ORDER BY role;