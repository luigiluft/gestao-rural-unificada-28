-- Update the profile name from "Perfil Auto - Fernando Moreirra" to "Administrador (franqueado)"
UPDATE permission_templates 
SET nome = 'Administrador (franqueado)'
WHERE nome = 'Perfil Auto - Fernando Moreirra' AND target_role = 'franqueado';