-- Remove template incorreto do franqueado
DELETE FROM user_permission_templates 
WHERE user_id = 'a695e2b8-a539-4374-ba04-8c2055c485ea';

-- Atribuir template correto ao motorista (user_id correto)
INSERT INTO user_permission_templates (user_id, template_id, assigned_by)
VALUES ('06691b92-7c08-48ac-8430-bd9440468f35', '4815b6d8-0211-4b29-9d4d-d638fbc2bd03', 'a695e2b8-a539-4374-ba04-8c2055c485ea')
ON CONFLICT (user_id) DO UPDATE SET 
  template_id = EXCLUDED.template_id,
  assigned_by = EXCLUDED.assigned_by;

-- Garantir que franqueados tenham acesso ao dashboard
INSERT INTO page_permissions (role, page_key, can_access)
VALUES ('franqueado', 'dashboard', true)
ON CONFLICT (role, page_key) DO UPDATE SET 
  can_access = true;