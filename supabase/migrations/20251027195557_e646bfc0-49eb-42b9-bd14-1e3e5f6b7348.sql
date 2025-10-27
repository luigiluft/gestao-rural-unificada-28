-- Atualizar templates de permissão para incluir contratos
UPDATE public.permission_templates 
SET permissions = array_append(permissions, 'contratos.view'::permission_code)
WHERE target_role = 'franqueado' 
  AND NOT ('contratos.view'::permission_code = ANY(permissions));

UPDATE public.permission_templates 
SET permissions = array_append(permissions, 'contratos.manage'::permission_code)
WHERE target_role = 'franqueado' 
  AND NOT ('contratos.manage'::permission_code = ANY(permissions));