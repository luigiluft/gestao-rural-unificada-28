-- Adicionar permissões de tabelas de frete para franqueados
UPDATE permission_templates
SET permissions = array_append(permissions, 'tabelas-frete.view'::permission_code)
WHERE target_role = 'franqueado'
AND NOT ('tabelas-frete.view'::permission_code = ANY(permissions));

UPDATE permission_templates
SET permissions = array_append(permissions, 'tabela-frete.view'::permission_code)
WHERE target_role = 'franqueado'
AND NOT ('tabela-frete.view'::permission_code = ANY(permissions));

-- Adicionar permissões de tabelas de frete para admins
UPDATE permission_templates
SET permissions = array_append(permissions, 'tabelas-frete.view'::permission_code)
WHERE target_role = 'admin'
AND NOT ('tabelas-frete.view'::permission_code = ANY(permissions));

UPDATE permission_templates
SET permissions = array_append(permissions, 'tabela-frete.view'::permission_code)
WHERE target_role = 'admin'
AND NOT ('tabela-frete.view'::permission_code = ANY(permissions));

-- Adicionar permissões aos usuários franqueados que já existem
INSERT INTO user_permissions (user_id, permission)
SELECT DISTINCT ur.user_id, 'tabelas-frete.view'::permission_code
FROM user_roles ur
WHERE ur.role = 'franqueado'
AND NOT EXISTS (
  SELECT 1 FROM user_permissions up
  WHERE up.user_id = ur.user_id
  AND up.permission = 'tabelas-frete.view'::permission_code
);

INSERT INTO user_permissions (user_id, permission)
SELECT DISTINCT ur.user_id, 'tabela-frete.view'::permission_code
FROM user_roles ur
WHERE ur.role = 'franqueado'
AND NOT EXISTS (
  SELECT 1 FROM user_permissions up
  WHERE up.user_id = ur.user_id
  AND up.permission = 'tabela-frete.view'::permission_code
);

-- Adicionar permissões aos usuários admin que já existem
INSERT INTO user_permissions (user_id, permission)
SELECT DISTINCT ur.user_id, 'tabelas-frete.view'::permission_code
FROM user_roles ur
WHERE ur.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_permissions up
  WHERE up.user_id = ur.user_id
  AND up.permission = 'tabelas-frete.view'::permission_code
);

INSERT INTO user_permissions (user_id, permission)
SELECT DISTINCT ur.user_id, 'tabela-frete.view'::permission_code
FROM user_roles ur
WHERE ur.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_permissions up
  WHERE up.user_id = ur.user_id
  AND up.permission = 'tabela-frete.view'::permission_code
);