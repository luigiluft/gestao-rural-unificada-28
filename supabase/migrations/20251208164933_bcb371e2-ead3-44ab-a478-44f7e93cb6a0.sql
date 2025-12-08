-- Criar enum para finalidade fiscal da NF-e
CREATE TYPE finalidade_nfe AS ENUM (
  'normal',      -- finNFe: 1 - NF-e Normal (Venda Padrão)
  'devolucao',   -- finNFe: 4 - NF-e de Devolução
  'remessa',     -- finNFe: 1 - Remessa de Produto (CFOP diferente)
  'complementar' -- finNFe: 2 - NF-e Complementar ou de Ajuste
);

-- Adicionar novos campos na tabela saidas
ALTER TABLE public.saidas 
  ADD COLUMN IF NOT EXISTS finalidade_nfe finalidade_nfe DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS nfe_referenciada_chave text,
  ADD COLUMN IF NOT EXISTS nfe_referenciada_data date,
  ADD COLUMN IF NOT EXISTS cfop text,
  ADD COLUMN IF NOT EXISTS gera_financeiro boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS movimenta_estoque text DEFAULT 'saida',
  ADD COLUMN IF NOT EXISTS tipo_complemento text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.saidas.finalidade_nfe IS 'Finalidade fiscal da NF-e: normal, devolucao, remessa, complementar';
COMMENT ON COLUMN public.saidas.nfe_referenciada_chave IS 'Chave de 44 dígitos da NF-e referenciada (obrigatório para devolução e complementar)';
COMMENT ON COLUMN public.saidas.nfe_referenciada_data IS 'Data da NF-e referenciada';
COMMENT ON COLUMN public.saidas.cfop IS 'Código Fiscal de Operações e Prestações';
COMMENT ON COLUMN public.saidas.gera_financeiro IS 'Indica se a operação gera movimentação financeira';
COMMENT ON COLUMN public.saidas.movimenta_estoque IS 'Tipo de movimentação de estoque: saida, entrada, nao_movimenta';
COMMENT ON COLUMN public.saidas.tipo_complemento IS 'Para NF complementar: valor, quantidade ou imposto';