-- Criar um template para franqueados que redireciona para proof-of-delivery
INSERT INTO public.permission_templates (
  user_id,
  nome,
  descricao,
  target_role,
  permissions,
  is_template,
  default_route
) VALUES (
  'a695e2b8-a539-4374-ba04-8c2055c485ea', -- ID do usuário franqueado atual
  'Perfil Proof of Delivery',
  'Perfil para usuários focados em entregas e comprovantes',
  'franqueado',
  ARRAY['proof-of-delivery.view', 'proof-of-delivery.manage', 'comprovantes.view']::permission_code[],
  true,
  '/proof-of-delivery'
) ON CONFLICT DO NOTHING;

-- Atribuir este template ao usuário atual para testar o redirecionamento
INSERT INTO public.user_permission_templates (
  user_id,
  template_id,
  assigned_by
) 
SELECT 
  'a695e2b8-a539-4374-ba04-8c2055c485ea',
  pt.id,
  'a695e2b8-a539-4374-ba04-8c2055c485ea'
FROM public.permission_templates pt
WHERE pt.nome = 'Perfil Proof of Delivery'
AND pt.user_id = 'a695e2b8-a539-4374-ba04-8c2055c485ea'
ON CONFLICT (user_id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  assigned_by = EXCLUDED.assigned_by;