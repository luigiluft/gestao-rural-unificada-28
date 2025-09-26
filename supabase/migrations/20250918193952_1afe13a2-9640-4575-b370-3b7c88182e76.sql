-- Processar convite pendente para usuário existente e corrigir trigger
-- 1. Processar o convite do usuário que já existe mas não tem profile
SELECT complete_invite_signup('55e002e5-c373-4e8b-9bbe-4b5145f08dac'::uuid, 'lucca+5@luft.com.br');

-- 2. Verificar se o trigger existe e recriá-lo se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Criar perfil básico primeiro
  INSERT INTO public.profiles (user_id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Se há um convite pendente, processá-lo
  PERFORM complete_invite_signup(NEW.id, NEW.email);
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();