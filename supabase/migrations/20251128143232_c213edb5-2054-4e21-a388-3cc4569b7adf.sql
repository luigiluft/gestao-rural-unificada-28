-- Criar tabela para solicitações de filial
CREATE TABLE IF NOT EXISTS public.solicitacoes_filial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_matriz_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  deposito_id UUID NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'rejeitada')),
  documentos JSONB DEFAULT '{}',
  observacoes TEXT,
  filial_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  solicitado_por UUID NOT NULL REFERENCES auth.users(id),
  aprovado_por UUID REFERENCES auth.users(id),
  data_conclusao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_solicitacoes_filial_matriz ON public.solicitacoes_filial(empresa_matriz_id);
CREATE INDEX idx_solicitacoes_filial_deposito ON public.solicitacoes_filial(deposito_id);
CREATE INDEX idx_solicitacoes_filial_status ON public.solicitacoes_filial(status);
CREATE INDEX idx_solicitacoes_filial_solicitante ON public.solicitacoes_filial(solicitado_por);

-- Trigger para updated_at
CREATE TRIGGER update_solicitacoes_filial_updated_at
  BEFORE UPDATE ON public.solicitacoes_filial
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- RLS Policies
ALTER TABLE public.solicitacoes_filial ENABLE ROW LEVEL SECURITY;

-- Admins veem tudo
CREATE POLICY "Admins view all solicitacoes_filial"
  ON public.solicitacoes_filial
  FOR SELECT
  TO authenticated
  USING (public.get_user_role_direct(auth.uid()) = 'admin');

-- Clientes veem suas próprias solicitações
CREATE POLICY "Clientes view own solicitacoes_filial"
  ON public.solicitacoes_filial
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role_direct(auth.uid()) = 'cliente'
    AND public.user_has_cliente_association(auth.uid(), empresa_matriz_id)
  );

-- Clientes podem criar solicitações para suas empresas
CREATE POLICY "Clientes create solicitacoes_filial"
  ON public.solicitacoes_filial
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role_direct(auth.uid()) = 'cliente'
    AND public.user_has_cliente_association(auth.uid(), empresa_matriz_id)
    AND solicitado_por = auth.uid()
  );

-- Admins podem atualizar qualquer solicitação
CREATE POLICY "Admins update solicitacoes_filial"
  ON public.solicitacoes_filial
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role_direct(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role_direct(auth.uid()) = 'admin');

-- Clientes podem atualizar apenas solicitações pendentes
CREATE POLICY "Clientes update pending solicitacoes_filial"
  ON public.solicitacoes_filial
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role_direct(auth.uid()) = 'cliente'
    AND public.user_has_cliente_association(auth.uid(), empresa_matriz_id)
    AND status = 'pendente'
  )
  WITH CHECK (
    public.get_user_role_direct(auth.uid()) = 'cliente'
    AND public.user_has_cliente_association(auth.uid(), empresa_matriz_id)
    AND status = 'pendente'
  );