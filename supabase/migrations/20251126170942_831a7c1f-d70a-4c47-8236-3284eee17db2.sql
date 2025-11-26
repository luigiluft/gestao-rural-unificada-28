-- Add page permissions for fiscal pages
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('remessa-deposito-ag', 'admin', true, true),
  ('remessa-deposito-ag', 'operador', true, true),
  ('remessa-deposito-ag', 'cliente', true, true),
  ('remessa-deposito-ag', 'motorista', false, false),
  
  ('nota-deposito', 'admin', true, true),
  ('nota-deposito', 'operador', true, true),
  ('nota-deposito', 'cliente', true, true),
  ('nota-deposito', 'motorista', false, false),
  
  ('retorno-simbolico', 'admin', true, true),
  ('retorno-simbolico', 'operador', true, true),
  ('retorno-simbolico', 'cliente', true, true),
  ('retorno-simbolico', 'motorista', false, false),
  
  ('retorno-fisico', 'admin', true, true),
  ('retorno-fisico', 'operador', true, true),
  ('retorno-fisico', 'cliente', true, true),
  ('retorno-fisico', 'motorista', false, false)
ON CONFLICT (page_key, role) 
DO UPDATE SET 
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;