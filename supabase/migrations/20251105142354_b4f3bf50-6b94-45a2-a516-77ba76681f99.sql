-- Adicionar novos status para saídas relacionados a devolução
DO $$ BEGIN
  ALTER TYPE saida_status ADD VALUE IF NOT EXISTS 'em_devolucao';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE saida_status ADD VALUE IF NOT EXISTS 'devolvido';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar enum para tipo de movimentação de saída
DO $$ BEGIN
  CREATE TYPE tipo_movimentacao_saida AS ENUM ('saida_normal', 'devolucao_total', 'devolucao_parcial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar campos na tabela saidas
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS saida_origem_id UUID REFERENCES public.saidas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_movimentacao tipo_movimentacao_saida DEFAULT 'saida_normal';

-- Criar índice para melhorar performance de consultas de devolução
CREATE INDEX IF NOT EXISTS idx_saidas_origem ON public.saidas(saida_origem_id) WHERE saida_origem_id IS NOT NULL;

-- Adicionar campos na tabela ocorrencias
ALTER TABLE public.ocorrencias 
ADD COLUMN IF NOT EXISTS requer_devolucao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS devolucao_id UUID REFERENCES public.entradas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantidade_devolvida JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.saidas.saida_origem_id IS 'Referência para a saída original em caso de devolução';
COMMENT ON COLUMN public.saidas.tipo_movimentacao IS 'Tipo de movimentação: saida_normal, devolucao_total ou devolucao_parcial';
COMMENT ON COLUMN public.ocorrencias.requer_devolucao IS 'Indica se a ocorrência requer devolução da carga';
COMMENT ON COLUMN public.ocorrencias.devolucao_id IS 'Referência para a entrada de devolução criada';
COMMENT ON COLUMN public.ocorrencias.quantidade_devolvida IS 'JSON com detalhes dos itens e quantidades devolvidas';