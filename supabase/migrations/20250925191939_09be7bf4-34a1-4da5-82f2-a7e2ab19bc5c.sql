-- Criar um template de exemplo para motoristas com redirecionamento para proof-of-delivery
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
  'Perfil Motorista - Entregas',
  'Perfil específico para motoristas com foco em entregas e comprovantes',
  'franqueado', -- Usando franqueado para poder testar
  ARRAY['proof-of-delivery.view', 'proof-of-delivery.manage', 'motorista.deliveries.view']::permission_code[],
  true,
  '/proof-of-delivery'
);

-- Atualizar o perfil do Joaquim para ser motorista
UPDATE public.profiles 
SET role = 'motorista' 
WHERE user_id = '06691b92-7c08-48ac-8430-bd9440468f35';