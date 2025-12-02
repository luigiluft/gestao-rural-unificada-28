-- Garantir que as configurações da empresa matriz podem ser lidas publicamente (para o site institucional)
DROP POLICY IF EXISTS "Anyone can view system configurations" ON public.configuracoes_sistema;
CREATE POLICY "Anyone can view system configurations"
ON public.configuracoes_sistema
FOR SELECT
USING (true);

-- Política para admins editarem
DROP POLICY IF EXISTS "Admins can manage system configurations" ON public.configuracoes_sistema;
CREATE POLICY "Admins can manage system configurations"
ON public.configuracoes_sistema
FOR ALL
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
);