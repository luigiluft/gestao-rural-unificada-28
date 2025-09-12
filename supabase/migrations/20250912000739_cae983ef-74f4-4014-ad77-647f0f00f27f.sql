-- Criar tabela centralizada de divergências
CREATE TABLE public.divergencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deposito_id UUID NOT NULL,
  tipo_origem TEXT NOT NULL CHECK (tipo_origem IN ('entrada', 'inventario', 'separacao')),
  
  -- Referências opcionais dependendo do tipo
  entrada_id UUID,
  inventario_id UUID, 
  saida_id UUID,
  
  -- Detalhes do produto/item
  produto_id UUID,
  pallet_id UUID,
  posicao_id UUID,
  lote TEXT,
  
  -- Quantidades
  quantidade_esperada NUMERIC NOT NULL DEFAULT 0,
  quantidade_encontrada NUMERIC NOT NULL DEFAULT 0,
  diferenca NUMERIC GENERATED ALWAYS AS (quantidade_encontrada - quantidade_esperada) STORED,
  
  -- Classificação da divergência
  tipo_divergencia TEXT NOT NULL CHECK (tipo_divergencia IN (
    'produto_faltante', 
    'produto_excedente', 
    'pallet_faltante', 
    'pallet_excedente',
    'quantidade_incorreta',
    'posicao_vazia',
    'posicao_ocupada_incorreta',
    'validade_incorreta',
    'lote_incorreto'
  )),
  
  -- Detalhes e resolução
  justificativa TEXT,
  observacoes TEXT,
  valor_impacto NUMERIC,
  
  -- Status e workflow
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'resolvido', 'cancelado')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  
  -- Auditoria de resolução
  resolvido_por UUID,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  resolucao_aplicada TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_divergencias_tipo_origem ON public.divergencias(tipo_origem);
CREATE INDEX idx_divergencias_status ON public.divergencias(status);
CREATE INDEX idx_divergencias_deposito ON public.divergencias(deposito_id);
CREATE INDEX idx_divergencias_produto ON public.divergencias(produto_id);
CREATE INDEX idx_divergencias_user ON public.divergencias(user_id);
CREATE INDEX idx_divergencias_created_at ON public.divergencias(created_at);

-- RLS Policies
ALTER TABLE public.divergencias ENABLE ROW LEVEL SECURITY;

-- Política para visualização
CREATE POLICY "Users can view divergences they manage" 
ON public.divergencias 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND deposito_id IN (
      SELECT f.id FROM franquias f 
      WHERE f.master_franqueado_id = auth.uid()
    )
  )
);

-- Política para inserção
CREATE POLICY "Users can create divergences" 
ON public.divergencias 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND deposito_id IN (
      SELECT f.id FROM franquias f 
      WHERE f.master_franqueado_id = auth.uid()
    )
  )
);

-- Política para atualização
CREATE POLICY "Users can update divergences they manage" 
ON public.divergencias 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND deposito_id IN (
      SELECT f.id FROM franquias f 
      WHERE f.master_franqueado_id = auth.uid()
    )
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_divergencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_divergencias_updated_at
  BEFORE UPDATE ON public.divergencias
  FOR EACH ROW
  EXECUTE FUNCTION update_divergencias_updated_at();