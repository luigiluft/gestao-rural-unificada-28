-- Add comprehensive fazenda fields for fiscal identification, location, rural data, and contact
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS uf_ie TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS cpf_cnpj_proprietario TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS situacao_cadastral TEXT DEFAULT 'ativa';

-- Location and Address fields
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS tipo_logradouro TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS nome_logradouro TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS codigo_ibge_municipio TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS referencia TEXT;

-- Rural-specific data fields
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS codigo_imovel_rural TEXT; -- NIRF
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS cadastro_ambiental_rural TEXT; -- CAR
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS area_total_ha NUMERIC;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS tipo_producao TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS capacidade_armazenagem_ton NUMERIC;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS infraestrutura TEXT;

-- Contact fields
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS nome_responsavel TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS telefone_contato TEXT;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS email_contato TEXT;