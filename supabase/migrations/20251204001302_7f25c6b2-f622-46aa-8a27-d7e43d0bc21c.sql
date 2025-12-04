-- FASE 1: Campos para negociação de cotações
ALTER TABLE public.cotacoes_loja
ADD COLUMN IF NOT EXISTS precos_negociados jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS versao integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS historico_negociacao jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ultima_acao_por text DEFAULT NULL;

-- FASE 2: Campos de personalização visual da loja
ALTER TABLE public.loja_configuracao
ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cor_fundo text DEFAULT NULL;