-- Criar tabela de perfis de funcionários
CREATE TABLE public.employee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  permissions permission_code[] NOT NULL DEFAULT '{}',
  is_template BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies para employee_profiles
CREATE POLICY "Users can manage their own employee profiles"
ON public.employee_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all employee profiles"
ON public.employee_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_employee_profiles_updated_at
BEFORE UPDATE ON public.employee_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir perfis padrão para franqueados
INSERT INTO public.employee_profiles (user_id, role, nome, descricao, permissions, is_template) VALUES
-- Perfis para franqueados (usando um UUID dummy, será atualizado depois)
('00000000-0000-0000-0000-000000000000', 'franqueado', 'Recebimento', 'Funcionário responsável pelo recebimento de mercadorias', ARRAY['entradas.view', 'recebimento.view', 'dashboard.view']::permission_code[], true),
('00000000-0000-0000-0000-000000000000', 'franqueado', 'Alocação', 'Funcionário responsável pela alocação de produtos', ARRAY['alocacao.view', 'estoque.view', 'dashboard.view']::permission_code[], true),
('00000000-0000-0000-0000-000000000000', 'franqueado', 'Separação', 'Funcionário responsável pela separação de pedidos', ARRAY['separacao.view', 'estoque.view', 'dashboard.view']::permission_code[], true),
('00000000-0000-0000-0000-000000000000', 'franqueado', 'Expedição', 'Funcionário responsável pela expedição de produtos', ARRAY['expedicao.view', 'saidas.view', 'dashboard.view']::permission_code[], true),
-- Perfis para produtores
('00000000-0000-0000-0000-000000000000', 'produtor', 'Entradas', 'Funcionário responsável pelo controle de entradas', ARRAY['entradas.view', 'entradas.manage', 'dashboard.view']::permission_code[], true),
('00000000-0000-0000-0000-000000000000', 'produtor', 'Saídas', 'Funcionário responsável pelo controle de saídas', ARRAY['saidas.view', 'saidas.manage', 'dashboard.view']::permission_code[], true),
('00000000-0000-0000-0000-000000000000', 'produtor', 'Estoque', 'Funcionário responsável pelo controle de estoque', ARRAY['estoque.view', 'rastreio.view', 'dashboard.view']::permission_code[], true);

-- Adicionar nova página de perfis nas permissões de página
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('perfis-funcionarios', 'admin', true, true),
  ('perfis-funcionarios', 'franqueado', true, true),
  ('perfis-funcionarios', 'produtor', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;