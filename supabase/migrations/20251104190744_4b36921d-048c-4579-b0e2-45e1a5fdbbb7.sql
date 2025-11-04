-- Criar tabela de CT-e (Conhecimento de Transporte Eletrônico)
CREATE TABLE IF NOT EXISTS public.ctes (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saida_id UUID NOT NULL REFERENCES public.saidas(id) ON DELETE CASCADE,
  chave_cte TEXT UNIQUE,
  numero_cte TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  modelo TEXT NOT NULL DEFAULT '57',
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tipo_ambiente TEXT NOT NULL DEFAULT 'homologacao',
  tipo_cte TEXT NOT NULL DEFAULT 'normal',
  cfop TEXT NOT NULL,
  natureza_operacao TEXT NOT NULL,
  modal TEXT NOT NULL DEFAULT '01',
  tipo_servico TEXT NOT NULL DEFAULT '0',
  
  -- Localização
  municipio_envio_codigo TEXT,
  municipio_envio_nome TEXT,
  municipio_envio_uf TEXT,
  municipio_inicio_codigo TEXT,
  municipio_inicio_nome TEXT,
  municipio_inicio_uf TEXT,
  municipio_fim_codigo TEXT,
  municipio_fim_nome TEXT,
  municipio_fim_uf TEXT,
  
  -- Emitente (Franquia/Transportadora)
  emitente_cnpj TEXT NOT NULL,
  emitente_ie TEXT,
  emitente_nome TEXT NOT NULL,
  emitente_fantasia TEXT,
  emitente_endereco JSONB,
  
  -- Remetente (Depósito)
  remetente_cnpj TEXT NOT NULL,
  remetente_ie TEXT,
  remetente_nome TEXT NOT NULL,
  remetente_fantasia TEXT,
  remetente_fone TEXT,
  remetente_endereco JSONB,
  
  -- Destinatário (Fazenda)
  destinatario_cnpj TEXT NOT NULL,
  destinatario_ie TEXT,
  destinatario_nome TEXT NOT NULL,
  destinatario_fone TEXT,
  destinatario_endereco JSONB,
  
  -- Tomador (Quem paga o frete)
  tomador_tipo TEXT NOT NULL DEFAULT '3',
  tomador_cnpj TEXT,
  tomador_ie TEXT,
  tomador_nome TEXT,
  tomador_fantasia TEXT,
  tomador_fone TEXT,
  tomador_endereco JSONB,
  
  -- Valores da Prestação
  valor_total_servico NUMERIC(10,2) NOT NULL,
  valor_receber NUMERIC(10,2) NOT NULL,
  componentes_valor JSONB,
  
  -- Impostos
  icms_situacao_tributaria TEXT,
  icms_base_calculo NUMERIC(10,2),
  icms_aliquota NUMERIC(5,2),
  icms_valor NUMERIC(10,2),
  valor_total_tributos NUMERIC(10,2),
  
  -- Informações da Carga
  valor_carga NUMERIC(10,2),
  produto_predominante TEXT,
  outras_caracteristicas TEXT,
  quantidades JSONB,
  
  -- Documentos Vinculados
  chaves_nfe JSONB,
  
  -- Seguro
  responsavel_seguro TEXT,
  nome_seguradora TEXT,
  numero_apolice TEXT,
  
  -- Modal Rodoviário
  rntrc TEXT,
  ordem_coleta JSONB,
  
  -- Protocolo de Autorização
  numero_protocolo TEXT,
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  digest_value TEXT,
  codigo_status TEXT,
  motivo_status TEXT,
  
  -- Campos de Controle
  status TEXT NOT NULL DEFAULT 'rascunho',
  xml_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  CONSTRAINT unique_saida_cte UNIQUE (saida_id)
);

-- Criar índices para melhor performance
CREATE INDEX idx_ctes_saida_id ON public.ctes(saida_id);
CREATE INDEX idx_ctes_chave_cte ON public.ctes(chave_cte);
CREATE INDEX idx_ctes_numero_cte ON public.ctes(numero_cte);
CREATE INDEX idx_ctes_status ON public.ctes(status);
CREATE INDEX idx_ctes_created_by ON public.ctes(created_by);

-- Habilitar RLS
ALTER TABLE public.ctes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem gerenciar todos os CT-es
CREATE POLICY "Admins can manage all ctes"
  ON public.ctes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Franqueados podem gerenciar CT-es de suas saídas
CREATE POLICY "Franqueados can manage their ctes"
  ON public.ctes
  FOR ALL
  USING (
    has_role(auth.uid(), 'franqueado'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.saidas s
      JOIN public.franquias f ON f.id = s.deposito_id
      WHERE s.id = ctes.saida_id
      AND f.master_franqueado_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'franqueado'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.saidas s
      JOIN public.franquias f ON f.id = s.deposito_id
      WHERE s.id = ctes.saida_id
      AND f.master_franqueado_id = auth.uid()
    )
  );

-- Policy: Produtores podem visualizar CT-es de suas saídas (read-only)
CREATE POLICY "Produtores can view their ctes"
  ON public.ctes
  FOR SELECT
  USING (
    has_role(auth.uid(), 'produtor'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.saidas s
      WHERE s.id = ctes.saida_id
      AND s.produtor_destinatario_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_ctes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ctes_updated_at
  BEFORE UPDATE ON public.ctes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ctes_updated_at();