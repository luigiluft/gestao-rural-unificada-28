-- Criar tabela de clientes (entidades fiscais)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_cliente TEXT NOT NULL CHECK (tipo_cliente IN ('empresa', 'produtor_rural')),
  
  -- Dados da entidade fiscal
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf_cnpj TEXT NOT NULL,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  
  -- Endereço fiscal
  endereco_fiscal TEXT,
  numero_fiscal TEXT,
  complemento_fiscal TEXT,
  bairro_fiscal TEXT,
  cidade_fiscal TEXT,
  estado_fiscal TEXT,
  cep_fiscal TEXT,
  
  -- Contato comercial
  telefone_comercial TEXT,
  email_comercial TEXT,
  
  -- Informações adicionais
  atividade_principal TEXT,
  regime_tributario TEXT,
  observacoes TEXT,
  
  -- Campos de controle
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(user_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON public.clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON public.clientes(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON public.clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_created_by ON public.clientes(created_by);

-- Criar tabela de relacionamento muitos-para-muitos
CREATE TABLE IF NOT EXISTS public.cliente_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- Papel do usuário no cliente
  papel TEXT NOT NULL DEFAULT 'gestor' CHECK (papel IN ('administrador', 'gestor', 'operador', 'visualizador')),
  
  -- Campos de controle
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(user_id),
  
  -- Garantir que um usuário não seja adicionado duas vezes ao mesmo cliente
  UNIQUE(cliente_id, user_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_cliente ON public.cliente_usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_user ON public.cliente_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_ativo ON public.cliente_usuarios(ativo);

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
-- Admins podem ver todos
CREATE POLICY "Admins can manage all clientes"
  ON public.clientes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver clientes aos quais estão vinculados
CREATE POLICY "Users can view their clientes"
  ON public.clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = clientes.id
        AND cu.user_id = auth.uid()
        AND cu.ativo = true
    )
  );

-- Administradores do cliente podem gerenciar
CREATE POLICY "Client admins can manage cliente"
  ON public.clientes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = clientes.id
        AND cu.user_id = auth.uid()
        AND cu.papel = 'administrador'
        AND cu.ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = clientes.id
        AND cu.user_id = auth.uid()
        AND cu.papel = 'administrador'
        AND cu.ativo = true
    )
  );

-- Políticas RLS para cliente_usuarios
-- Admins podem gerenciar todos
CREATE POLICY "Admins can manage all cliente_usuarios"
  ON public.cliente_usuarios
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver suas próprias vinculações
CREATE POLICY "Users can view their own cliente_usuarios"
  ON public.cliente_usuarios
  FOR SELECT
  USING (user_id = auth.uid());

-- Administradores do cliente podem gerenciar usuários do cliente
CREATE POLICY "Client admins can manage cliente_usuarios"
  ON public.cliente_usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = cliente_usuarios.cliente_id
        AND cu.user_id = auth.uid()
        AND cu.papel = 'administrador'
        AND cu.ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = cliente_usuarios.cliente_id
        AND cu.user_id = auth.uid()
        AND cu.papel = 'administrador'
        AND cu.ativo = true
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.clientes IS 'Entidades fiscais (empresas ou produtores rurais) separadas dos usuários do sistema';
COMMENT ON TABLE public.cliente_usuarios IS 'Relacionamento muitos-para-muitos entre clientes e usuários do sistema';
COMMENT ON COLUMN public.clientes.tipo_cliente IS 'Tipo de cliente: empresa ou produtor_rural';
COMMENT ON COLUMN public.cliente_usuarios.papel IS 'Papel do usuário no cliente: administrador, gestor, operador ou visualizador';