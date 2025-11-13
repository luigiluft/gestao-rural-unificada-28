-- Adicionar campos de empresa à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS cnpj_empresa TEXT,
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS telefone_comercial TEXT,
ADD COLUMN IF NOT EXISTS atividade_principal TEXT,
ADD COLUMN IF NOT EXISTS observacoes_empresa TEXT,
ADD COLUMN IF NOT EXISTS is_produtor_rural BOOLEAN DEFAULT false;

-- Criar índice para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_profiles_cnpj_empresa ON public.profiles(cnpj_empresa) WHERE cnpj_empresa IS NOT NULL;