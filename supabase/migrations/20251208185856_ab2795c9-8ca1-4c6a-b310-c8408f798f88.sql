-- Tabela de fluxo de documentos fiscais entre empresas
CREATE TABLE IF NOT EXISTS public.documento_fluxo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Documento de origem (saída)
  saida_id UUID REFERENCES public.saidas(id) ON DELETE SET NULL,
  cte_id UUID REFERENCES public.ctes(id) ON DELETE SET NULL,
  
  -- Documento gerado (entrada)
  entrada_id UUID REFERENCES public.entradas(id) ON DELETE SET NULL,
  viagem_id UUID REFERENCES public.viagens(id) ON DELETE SET NULL,
  
  -- Empresas envolvidas
  cliente_origem_id UUID REFERENCES public.clientes(id) NOT NULL,
  cliente_destino_id UUID REFERENCES public.clientes(id) NOT NULL,
  
  -- Operador logístico (se aplicável)
  operador_deposito_id UUID REFERENCES public.franquias(id),
  
  -- Transportadora (se aplicável)
  transportadora_id UUID REFERENCES public.transportadoras(id),
  
  -- Metadados
  tipo_fluxo TEXT NOT NULL CHECK (tipo_fluxo IN ('venda', 'transferencia', 'remessa', 'devolucao')),
  chave_nfe TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'confirmado', 'rejeitado')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  recebido_at TIMESTAMPTZ,
  confirmado_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para documento_fluxo
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_saida ON public.documento_fluxo(saida_id);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_entrada ON public.documento_fluxo(entrada_id);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_cliente_origem ON public.documento_fluxo(cliente_origem_id);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_cliente_destino ON public.documento_fluxo(cliente_destino_id);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_status ON public.documento_fluxo(status);

-- Novos campos na tabela clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS operador_logistico_id UUID REFERENCES public.franquias(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS transportadora_padrao_id UUID REFERENCES public.transportadoras(id);

-- Novos campos na tabela entradas
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS saida_origem_id UUID REFERENCES public.saidas(id);
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS documento_fluxo_id UUID REFERENCES public.documento_fluxo(id);
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_recebimento TEXT DEFAULT 'manual' CHECK (tipo_recebimento IN ('manual', 'edi_interno', 'sefaz'));

-- Tabela para vincular transportadoras a usuários TMS
CREATE TABLE IF NOT EXISTS public.transportadoras_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id UUID REFERENCES public.transportadoras(id) NOT NULL,
  user_id UUID NOT NULL,
  papel TEXT DEFAULT 'operador' CHECK (papel IN ('master', 'operador', 'motorista')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transportadora_id, user_id)
);

-- Índices para transportadoras_usuarios
CREATE INDEX IF NOT EXISTS idx_transportadoras_usuarios_transportadora ON public.transportadoras_usuarios(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_transportadoras_usuarios_user ON public.transportadoras_usuarios(user_id);

-- RLS para documento_fluxo
ALTER TABLE public.documento_fluxo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver fluxos onde são origem ou destino"
ON public.documento_fluxo FOR SELECT
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR cliente_origem_id IN (SELECT cliente_id FROM public.cliente_usuarios WHERE user_id = auth.uid() AND ativo = true)
  OR cliente_destino_id IN (SELECT cliente_id FROM public.cliente_usuarios WHERE user_id = auth.uid() AND ativo = true)
  OR operador_deposito_id IN (SELECT franquia_id FROM public.franquia_usuarios WHERE user_id = auth.uid() AND ativo = true)
);

CREATE POLICY "Sistema pode inserir fluxos"
ON public.documento_fluxo FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar fluxos onde são destino"
ON public.documento_fluxo FOR UPDATE
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR cliente_destino_id IN (SELECT cliente_id FROM public.cliente_usuarios WHERE user_id = auth.uid() AND ativo = true)
  OR operador_deposito_id IN (SELECT franquia_id FROM public.franquia_usuarios WHERE user_id = auth.uid() AND ativo = true)
);

-- RLS para transportadoras_usuarios
ALTER TABLE public.transportadoras_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas associações com transportadoras"
ON public.transportadoras_usuarios FOR SELECT
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR user_id = auth.uid()
);

CREATE POLICY "Admins podem gerenciar transportadoras_usuarios"
ON public.transportadoras_usuarios FOR ALL
USING (public.get_user_role_direct(auth.uid()) = 'admin');

-- Habilitar realtime para documento_fluxo
ALTER PUBLICATION supabase_realtime ADD TABLE public.documento_fluxo;