-- Tabela de relacionamento empresa -> clientes
CREATE TABLE public.empresa_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_relacionamento TEXT DEFAULT 'cliente',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(user_id),
  UNIQUE(empresa_id, cliente_id)
);

-- Enable RLS
ALTER TABLE public.empresa_clientes ENABLE ROW LEVEL SECURITY;

-- Policies: usuários podem ver/gerenciar clientes das empresas que administram
CREATE POLICY "empresa_clientes_select_policy" ON public.empresa_clientes
  FOR SELECT USING (
    check_user_role_safe(auth.uid(), 'admin'::app_role) OR
    user_is_cliente_member(auth.uid(), empresa_id)
  );

CREATE POLICY "empresa_clientes_insert_policy" ON public.empresa_clientes
  FOR INSERT WITH CHECK (
    check_user_role_safe(auth.uid(), 'admin'::app_role) OR
    user_is_cliente_member(auth.uid(), empresa_id)
  );

CREATE POLICY "empresa_clientes_update_policy" ON public.empresa_clientes
  FOR UPDATE USING (
    check_user_role_safe(auth.uid(), 'admin'::app_role) OR
    user_is_cliente_member(auth.uid(), empresa_id)
  );

CREATE POLICY "empresa_clientes_delete_policy" ON public.empresa_clientes
  FOR DELETE USING (
    check_user_role_safe(auth.uid(), 'admin'::app_role) OR
    user_is_cliente_member(auth.uid(), empresa_id)
  );

-- Indexes
CREATE INDEX idx_empresa_clientes_empresa ON public.empresa_clientes(empresa_id);
CREATE INDEX idx_empresa_clientes_cliente ON public.empresa_clientes(cliente_id);
CREATE INDEX idx_empresa_clientes_ativo ON public.empresa_clientes(ativo);