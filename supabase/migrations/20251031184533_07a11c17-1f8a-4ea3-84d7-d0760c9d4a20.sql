-- Criar tabela para SLAs de contratos
CREATE TABLE IF NOT EXISTS public.contrato_slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos_servico(id) ON DELETE CASCADE,
  tipo_sla TEXT NOT NULL CHECK (tipo_sla IN (
    'prazo_recebimento',
    'prazo_expedicao', 
    'disponibilidade_estoque',
    'acuracia_inventario',
    'outro'
  )),
  descricao TEXT NOT NULL,
  valor_meta NUMERIC NOT NULL CHECK (valor_meta > 0),
  unidade_medida TEXT NOT NULL,
  penalidade_descumprimento TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para consultas por contrato
CREATE INDEX IF NOT EXISTS idx_contrato_slas_contrato_id ON public.contrato_slas(contrato_id);

-- Criar tabela para janelas de entrega de contratos
CREATE TABLE IF NOT EXISTS public.contrato_janelas_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos_servico(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  capacidade_max_pallets INTEGER,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_horario CHECK (hora_fim > hora_inicio)
);

-- Criar índice para consultas por contrato
CREATE INDEX IF NOT EXISTS idx_contrato_janelas_entrega_contrato_id ON public.contrato_janelas_entrega(contrato_id);

-- Habilitar RLS
ALTER TABLE public.contrato_slas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_janelas_entrega ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contrato_slas
CREATE POLICY "Admins podem ver todos os SLAs"
  ON public.contrato_slas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Franqueados podem ver SLAs de seus contratos"
  ON public.contrato_slas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contratos_servico cs
      JOIN public.franquias f ON f.id = cs.franquia_id
      WHERE cs.id = contrato_id
      AND f.master_franqueado_id = auth.uid()
    )
  );

CREATE POLICY "Produtores podem ver SLAs de seus contratos"
  ON public.contrato_slas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contratos_servico cs
      WHERE cs.id = contrato_id
      AND cs.produtor_id = auth.uid()
    )
  );

CREATE POLICY "Admins e franqueados podem inserir SLAs"
  ON public.contrato_slas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

CREATE POLICY "Admins e franqueados podem atualizar SLAs"
  ON public.contrato_slas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

CREATE POLICY "Admins e franqueados podem deletar SLAs"
  ON public.contrato_slas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

-- Políticas RLS para contrato_janelas_entrega (mesmas permissões que SLAs)
CREATE POLICY "Admins podem ver todas as janelas"
  ON public.contrato_janelas_entrega FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Franqueados podem ver janelas de seus contratos"
  ON public.contrato_janelas_entrega FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contratos_servico cs
      JOIN public.franquias f ON f.id = cs.franquia_id
      WHERE cs.id = contrato_id
      AND f.master_franqueado_id = auth.uid()
    )
  );

CREATE POLICY "Produtores podem ver janelas de seus contratos"
  ON public.contrato_janelas_entrega FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contratos_servico cs
      WHERE cs.id = contrato_id
      AND cs.produtor_id = auth.uid()
    )
  );

CREATE POLICY "Admins e franqueados podem inserir janelas"
  ON public.contrato_janelas_entrega FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

CREATE POLICY "Admins e franqueados podem atualizar janelas"
  ON public.contrato_janelas_entrega FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

CREATE POLICY "Admins e franqueados podem deletar janelas"
  ON public.contrato_janelas_entrega FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );