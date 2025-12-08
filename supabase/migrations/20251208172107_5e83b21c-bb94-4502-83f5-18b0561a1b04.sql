-- Update permission_templates for operador/franqueado to include configurar-impostos permissions
UPDATE permission_templates
SET permissions = array_append(permissions, 'configurar-impostos.view'::permission_code)
WHERE target_role = 'franqueado' AND NOT ('configurar-impostos.view'::permission_code = ANY(permissions));

UPDATE permission_templates
SET permissions = array_append(permissions, 'configurar-impostos.manage'::permission_code)
WHERE target_role = 'franqueado' AND NOT ('configurar-impostos.manage'::permission_code = ANY(permissions));

-- Update permission_templates for cliente to include configurar-impostos permissions
UPDATE permission_templates
SET permissions = array_append(permissions, 'configurar-impostos.view'::permission_code)
WHERE target_role = 'cliente' AND NOT ('configurar-impostos.view'::permission_code = ANY(permissions));

UPDATE permission_templates
SET permissions = array_append(permissions, 'configurar-impostos.manage'::permission_code)
WHERE target_role = 'cliente' AND NOT ('configurar-impostos.manage'::permission_code = ANY(permissions));