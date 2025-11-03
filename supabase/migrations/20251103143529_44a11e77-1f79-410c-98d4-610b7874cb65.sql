-- Create contrato_franquia table
CREATE TABLE IF NOT EXISTS contrato_franquia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_contrato TEXT UNIQUE NOT NULL,
  franquia_id UUID NOT NULL REFERENCES franquias(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado')),
  dia_vencimento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  
  -- Tipo de cobrança de royalties
  tipo_royalty TEXT NOT NULL CHECK (tipo_royalty IN ('percentual_faturamento', 'valor_fixo_mensal', 'margem_por_servico')),
  
  -- Se percentual_faturamento
  percentual_faturamento NUMERIC(5,2) CHECK (percentual_faturamento IS NULL OR (percentual_faturamento >= 0 AND percentual_faturamento <= 100)),
  
  -- Se valor_fixo_mensal
  valor_fixo_mensal NUMERIC(10,2) CHECK (valor_fixo_mensal IS NULL OR valor_fixo_mensal >= 0),
  
  -- Se margem_por_servico (JSONB com estrutura por tipo)
  margens_servico JSONB,
  
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create royalties table
CREATE TABLE IF NOT EXISTS royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_royalty TEXT UNIQUE NOT NULL,
  contrato_franquia_id UUID REFERENCES contrato_franquia(id),
  franquia_id UUID NOT NULL REFERENCES franquias(id),
  
  -- Período de referência
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  
  -- Datas
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  
  -- Valores
  valor_base NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_royalties NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_descontos NUMERIC(10,2) DEFAULT 0,
  valor_acrescimos NUMERIC(10,2) DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente', 'pago', 'vencido', 'cancelado')),
  
  -- Controle
  data_fechamento TIMESTAMPTZ,
  fechada_por UUID REFERENCES auth.users(id),
  data_pagamento TIMESTAMPTZ,
  forma_pagamento TEXT,
  observacoes TEXT,
  gerada_automaticamente BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create royalty_itens table
CREATE TABLE IF NOT EXISTS royalty_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  royalty_id UUID NOT NULL REFERENCES royalties(id) ON DELETE CASCADE,
  
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  
  quantidade NUMERIC(10,2) NOT NULL,
  valor_faturado NUMERIC(10,2) NOT NULL,
  margem_unitaria NUMERIC(10,2),
  percentual_royalty NUMERIC(5,2),
  valor_royalty NUMERIC(10,2) NOT NULL,
  
  detalhes_calculo JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE contrato_franquia ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contrato_franquia
CREATE POLICY "Admins can manage all contrato_franquia"
  ON contrato_franquia FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can view their own contrato_franquia"
  ON contrato_franquia FOR SELECT
  USING (
    has_role(auth.uid(), 'franqueado'::app_role) AND
    franquia_id IN (
      SELECT id FROM franquias WHERE master_franqueado_id = auth.uid()
    )
  );

-- RLS Policies for royalties
CREATE POLICY "Admins can manage all royalties"
  ON royalties FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can view their own royalties"
  ON royalties FOR SELECT
  USING (
    has_role(auth.uid(), 'franqueado'::app_role) AND
    franquia_id IN (
      SELECT id FROM franquias WHERE master_franqueado_id = auth.uid()
    )
  );

-- RLS Policies for royalty_itens
CREATE POLICY "Admins can manage all royalty_itens"
  ON royalty_itens FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Franqueados can view their royalty_itens"
  ON royalty_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM royalties r
      JOIN franquias f ON f.id = r.franquia_id
      WHERE r.id = royalty_itens.royalty_id
      AND (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
    )
  );

-- Create indexes
CREATE INDEX idx_contrato_franquia_franquia_id ON contrato_franquia(franquia_id);
CREATE INDEX idx_contrato_franquia_status ON contrato_franquia(status);
CREATE INDEX idx_royalties_franquia_id ON royalties(franquia_id);
CREATE INDEX idx_royalties_status ON royalties(status);
CREATE INDEX idx_royalties_data_vencimento ON royalties(data_vencimento);
CREATE INDEX idx_royalty_itens_royalty_id ON royalty_itens(royalty_id);

-- Trigger to update updated_at
CREATE TRIGGER update_contrato_franquia_updated_at
  BEFORE UPDATE ON contrato_franquia
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_royalties_updated_at
  BEFORE UPDATE ON royalties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();