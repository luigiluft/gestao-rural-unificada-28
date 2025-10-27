-- =====================================================
-- FASE 1: SISTEMA DE FATURAMENTO E CONTRATOS
-- Parte 1: Tabelas e Enums
-- =====================================================

-- ============== ENUMS ==============

CREATE TYPE status_contrato AS ENUM ('ativo', 'suspenso', 'cancelado', 'expirado');
CREATE TYPE tipo_cobranca AS ENUM ('mensal', 'quinzenal', 'por_demanda');
CREATE TYPE tipo_servico_contrato AS ENUM (
  'armazenagem_pallet_dia',
  'entrada_item', 
  'saida_item',
  'taxa_fixa_mensal',
  'movimentacao_interna',
  'separacao_picking',
  'repaletizacao'
);
CREATE TYPE tipo_sla AS ENUM (
  'tempo_processamento_entrada',
  'tempo_preparacao_saida',
  'prazo_entrega',
  'taxa_avarias_max',
  'tempo_resposta_divergencia'
);
CREATE TYPE unidade_sla AS ENUM ('horas', 'dias', 'percentual');
CREATE TYPE status_fatura AS ENUM ('rascunho', 'pendente', 'pago', 'vencido', 'cancelado', 'contestado');

-- ============== TABELAS ==============

CREATE TABLE public.contratos_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franquia_id UUID NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  produtor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  numero_contrato TEXT NOT NULL UNIQUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status status_contrato NOT NULL DEFAULT 'ativo',
  tipo_cobranca tipo_cobranca NOT NULL DEFAULT 'mensal',
  dia_vencimento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 31),
  observacoes TEXT,
  criado_por UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_contratos_franquia ON public.contratos_servico(franquia_id);
CREATE INDEX idx_contratos_produtor ON public.contratos_servico(produtor_id);
CREATE INDEX idx_contratos_status ON public.contratos_servico(status);
CREATE INDEX idx_contratos_numero ON public.contratos_servico(numero_contrato);

CREATE TABLE public.contrato_servicos_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos_servico(id) ON DELETE CASCADE,
  tipo_servico tipo_servico_contrato NOT NULL,
  descricao TEXT,
  valor_unitario NUMERIC(10,2) NOT NULL CHECK (valor_unitario >= 0),
  quantidade_minima NUMERIC(10,2) DEFAULT 0,
  quantidade_incluida NUMERIC(10,2) DEFAULT 0,
  valor_excedente NUMERIC(10,2),
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_contrato_itens_contrato ON public.contrato_servicos_itens(contrato_id);
CREATE INDEX idx_contrato_itens_tipo ON public.contrato_servicos_itens(tipo_servico);

CREATE TABLE public.contrato_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos_servico(id) ON DELETE CASCADE,
  tipo_sla tipo_sla NOT NULL,
  descricao TEXT,
  valor_esperado NUMERIC(10,2) NOT NULL,
  unidade unidade_sla NOT NULL,
  penalidade_percentual NUMERIC(5,2) DEFAULT 0 CHECK (penalidade_percentual >= 0 AND penalidade_percentual <= 100),
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_contrato_sla_contrato ON public.contrato_sla(contrato_id);
CREATE INDEX idx_contrato_sla_tipo ON public.contrato_sla(tipo_sla);

CREATE TABLE public.contrato_janelas_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos_servico(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  capacidade_max_pallets INTEGER,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT valid_time_range CHECK (hora_fim > hora_inicio)
);

CREATE INDEX idx_janelas_contrato ON public.contrato_janelas_entrega(contrato_id);
CREATE INDEX idx_janelas_dia_semana ON public.contrato_janelas_entrega(dia_semana);

CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_fatura TEXT NOT NULL UNIQUE,
  contrato_id UUID REFERENCES public.contratos_servico(id) ON DELETE SET NULL,
  franquia_id UUID NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  produtor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  valor_servicos NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_descontos NUMERIC(12,2) DEFAULT 0,
  valor_acrescimos NUMERIC(12,2) DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status status_fatura NOT NULL DEFAULT 'pendente',
  data_pagamento TIMESTAMP WITH TIME ZONE,
  forma_pagamento TEXT,
  observacoes TEXT,
  gerada_automaticamente BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT valid_period CHECK (periodo_fim >= periodo_inicio),
  CONSTRAINT valid_valores CHECK (valor_total = valor_servicos - valor_descontos + valor_acrescimos)
);

CREATE INDEX idx_faturas_numero ON public.faturas(numero_fatura);
CREATE INDEX idx_faturas_contrato ON public.faturas(contrato_id);
CREATE INDEX idx_faturas_franquia ON public.faturas(franquia_id);
CREATE INDEX idx_faturas_produtor ON public.faturas(produtor_id);
CREATE INDEX idx_faturas_status ON public.faturas(status);
CREATE INDEX idx_faturas_periodo ON public.faturas(periodo_inicio, periodo_fim);
CREATE INDEX idx_faturas_vencimento ON public.faturas(data_vencimento);

CREATE TABLE public.fatura_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  tipo_servico TEXT NOT NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  valor_unitario NUMERIC(10,2) NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL,
  periodo_inicio DATE,
  periodo_fim DATE,
  detalhes_calculo JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT valid_valor_item CHECK (valor_total = quantidade * valor_unitario)
);

CREATE INDEX idx_fatura_itens_fatura ON public.fatura_itens(fatura_id);
CREATE INDEX idx_fatura_itens_tipo ON public.fatura_itens(tipo_servico);

CREATE TABLE public.fatura_calculos_detalhados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  tipo_calculo TEXT NOT NULL,
  detalhes_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_calculos_fatura ON public.fatura_calculos_detalhados(fatura_id);
CREATE INDEX idx_calculos_tipo ON public.fatura_calculos_detalhados(tipo_calculo);

-- ============== TRIGGERS ==============

CREATE TRIGGER update_contratos_servico_updated_at
  BEFORE UPDATE ON public.contratos_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_servicos_itens_updated_at
  BEFORE UPDATE ON public.contrato_servicos_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_sla_updated_at
  BEFORE UPDATE ON public.contrato_sla
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_janelas_updated_at
  BEFORE UPDATE ON public.contrato_janelas_entrega
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faturas_updated_at
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== FUNCTIONS ==============

CREATE OR REPLACE FUNCTION public.gerar_numero_contrato(p_franquia_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contador INTEGER;
  v_codigo_franquia TEXT;
  v_numero_contrato TEXT;
BEGIN
  SELECT COALESCE(codigo_interno, SUBSTRING(id::TEXT FROM 1 FOR 4))
  INTO v_codigo_franquia FROM public.franquias WHERE id = p_franquia_id;
  
  SELECT COUNT(*) + 1 INTO v_contador 
  FROM public.contratos_servico WHERE franquia_id = p_franquia_id;
  
  v_numero_contrato := 'CTR-' || v_codigo_franquia || '-' || 
                       TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
                       LPAD(v_contador::TEXT, 3, '0');
  RETURN v_numero_contrato;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_numero_fatura(p_franquia_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contador INTEGER;
  v_codigo_franquia TEXT;
  v_numero_fatura TEXT;
BEGIN
  SELECT COALESCE(codigo_interno, SUBSTRING(id::TEXT FROM 1 FOR 4))
  INTO v_codigo_franquia FROM public.franquias WHERE id = p_franquia_id;
  
  SELECT COUNT(*) + 1 INTO v_contador FROM public.faturas
  WHERE franquia_id = p_franquia_id
    AND EXTRACT(YEAR FROM data_emissao) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM data_emissao) = EXTRACT(MONTH FROM CURRENT_DATE);
  
  v_numero_fatura := 'FAT-' || v_codigo_franquia || '-' || 
                     TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' ||
                     LPAD(v_contador::TEXT, 3, '0');
  RETURN v_numero_fatura;
END;
$$;

-- ============== RLS ==============

ALTER TABLE public.contratos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_servicos_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_janelas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatura_calculos_detalhados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all contracts" ON public.contratos_servico FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados manage own franchise contracts" ON public.contratos_servico FOR ALL
  USING (has_role(auth.uid(), 'franqueado'::app_role) AND franquia_id IN (
    SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'franqueado'::app_role) AND franquia_id IN (
    SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid()));

CREATE POLICY "Produtores view own contracts" ON public.contratos_servico FOR SELECT
  USING (has_role(auth.uid(), 'produtor'::app_role) AND produtor_id = auth.uid());

CREATE POLICY "Users manage contract items via contract access" ON public.contrato_servicos_itens FOR ALL
  USING (EXISTS (SELECT 1 FROM public.contratos_servico cs WHERE cs.id = contrato_servicos_itens.contrato_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND cs.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND cs.produtor_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contratos_servico cs WHERE cs.id = contrato_servicos_itens.contrato_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND cs.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())))));

CREATE POLICY "Users manage SLA via contract access" ON public.contrato_sla FOR ALL
  USING (EXISTS (SELECT 1 FROM public.contratos_servico cs WHERE cs.id = contrato_sla.contrato_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND cs.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND cs.produtor_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contratos_servico cs WHERE cs.id = contrato_sla.contrato_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND cs.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())))));

CREATE POLICY "Users manage delivery windows via contract access" ON public.contrato_janelas_entrega FOR ALL
  USING (EXISTS (SELECT 1 FROM public.contratos_servico cs WHERE cs.id = contrato_janelas_entrega.contrato_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND cs.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND cs.produtor_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contratos_servico cs WHERE cs.id = contrato_janelas_entrega.contrato_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND cs.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())))));

CREATE POLICY "Admins manage all invoices" ON public.faturas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados manage own franchise invoices" ON public.faturas FOR ALL
  USING (has_role(auth.uid(), 'franqueado'::app_role) AND franquia_id IN (
    SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'franqueado'::app_role) AND franquia_id IN (
    SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid()));

CREATE POLICY "Produtores view own invoices" ON public.faturas FOR SELECT
  USING (has_role(auth.uid(), 'produtor'::app_role) AND produtor_id = auth.uid());

CREATE POLICY "Users view invoice items via invoice access" ON public.fatura_itens FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.faturas f WHERE f.id = fatura_itens.fatura_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND f.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND f.produtor_id = auth.uid()))));

CREATE POLICY "Authorized users insert invoice items" ON public.fatura_itens FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.faturas f WHERE f.id = fatura_itens.fatura_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND f.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())))));

CREATE POLICY "Authorized users update invoice items" ON public.fatura_itens FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.faturas f WHERE f.id = fatura_itens.fatura_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND f.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())))));

CREATE POLICY "Authorized users delete invoice items" ON public.fatura_itens FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.faturas f WHERE f.id = fatura_itens.fatura_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND f.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())))));

CREATE POLICY "Users view calculation details via invoice access" ON public.fatura_calculos_detalhados FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.faturas f WHERE f.id = fatura_calculos_detalhados.fatura_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND f.franquia_id IN (SELECT id FROM public.franquias WHERE master_franqueado_id = auth.uid())) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND f.produtor_id = auth.uid()))));

CREATE POLICY "System can insert calculation details" ON public.fatura_calculos_detalhados FOR INSERT
  WITH CHECK (true);

-- Adicionar novos valores ao enum permission_code
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'contratos.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'contratos.manage';