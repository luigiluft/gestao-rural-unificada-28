-- Rename the template to avoid duplicated role in UI
UPDATE permission_templates 
SET nome = 'Administrador'
WHERE nome = 'Administrador (franqueado)' AND target_role = 'franqueado';