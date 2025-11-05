-- Adicionar colunas de priorização à tabela saidas
ALTER TABLE public.saidas
ADD COLUMN IF NOT EXISTS prioridade_calculada NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade_ultima_atualizacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS contrato_servico_id UUID REFERENCES public.contratos_servico(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scores_fatores JSONB DEFAULT '{}'::jsonb;

-- Adicionar colunas de priorização à tabela contratos_servico
ALTER TABLE public.contratos_servico
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prioridade_padrao NUMERIC DEFAULT 50 CHECK (prioridade_padrao >= 0 AND prioridade_padrao <= 100);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_saidas_prioridade ON public.saidas(prioridade_calculada DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_saidas_status_prioridade ON public.saidas(status, prioridade_calculada DESC);
CREATE INDEX IF NOT EXISTS idx_saidas_contrato ON public.saidas(contrato_servico_id);
CREATE INDEX IF NOT EXISTS idx_saidas_tags ON public.saidas USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contratos_tags ON public.contratos_servico USING GIN(tags);