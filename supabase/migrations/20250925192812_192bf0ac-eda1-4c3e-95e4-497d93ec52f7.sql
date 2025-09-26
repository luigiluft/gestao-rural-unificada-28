-- Add page permissions for motorista role
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
  ('proof-of-delivery', 'motorista', true, true),
  ('comprovantes', 'motorista', true, true),
  ('perfil', 'motorista', true, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;

-- Fix permission templates for motorista - correct target_role
UPDATE public.permission_templates 
SET 
  target_role = 'motorista',
  default_route = '/proof-of-delivery'
WHERE nome IN ('Motorista', 'Perfil Proof of Delivery', 'Perfil Motorista - Entregas')
  AND target_role != 'motorista';