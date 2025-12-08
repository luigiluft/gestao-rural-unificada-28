-- 1. Atualizar todos os usuários existentes de 'produtor' para 'cliente'
UPDATE public.profiles SET role = 'cliente' WHERE role = 'produtor';

-- 2. Atualizar o trigger handle_new_user para usar 'cliente' como default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', 'Usuário'),
    'cliente'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Garantir que page_permissions tem entradas para 'cliente'
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('dashboard', 'cliente', true, true),
  ('rastreio', 'cliente', true, true),
  ('estoque', 'cliente', true, true),
  ('entradas', 'cliente', true, true),
  ('saidas', 'cliente', true, true),
  ('empresas', 'cliente', true, true),
  ('configuracoes', 'cliente', true, true),
  ('perfil', 'cliente', true, true),
  ('minha-loja', 'cliente', true, true),
  ('financeiro', 'cliente', true, true),
  ('receitas', 'cliente', true, true),
  ('despesas', 'cliente', true, true),
  ('caixa', 'cliente', true, true),
  ('faturas', 'cliente', true, true),
  ('movimentos-estoque', 'cliente', true, true),
  ('posicionamento-estoque', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;

-- 4. Atualizar função sync_produtor_row_on_profiles para usar 'cliente'
CREATE OR REPLACE FUNCTION public.sync_produtor_row_on_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'cliente' THEN
      INSERT INTO public.produtores(user_id) VALUES (NEW.user_id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role = 'cliente' AND (OLD.role IS NULL OR OLD.role != 'cliente') THEN
      INSERT INTO public.produtores(user_id) VALUES (NEW.user_id)
      ON CONFLICT (user_id) DO NOTHING;
    ELSIF OLD.role = 'cliente' AND NEW.role != 'cliente' THEN
      DELETE FROM public.produtores WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;