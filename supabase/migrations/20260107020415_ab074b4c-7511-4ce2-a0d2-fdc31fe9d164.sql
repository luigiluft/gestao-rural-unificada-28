-- Adicionar campos do emitente na tabela saidas para consistência com entradas
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS emitente_nome TEXT,
ADD COLUMN IF NOT EXISTS emitente_nome_fantasia TEXT,
ADD COLUMN IF NOT EXISTS emitente_cnpj TEXT,
ADD COLUMN IF NOT EXISTS emitente_ie TEXT,
ADD COLUMN IF NOT EXISTS emitente_logradouro TEXT,
ADD COLUMN IF NOT EXISTS emitente_numero TEXT,
ADD COLUMN IF NOT EXISTS emitente_complemento TEXT,
ADD COLUMN IF NOT EXISTS emitente_bairro TEXT,
ADD COLUMN IF NOT EXISTS emitente_municipio TEXT,
ADD COLUMN IF NOT EXISTS emitente_uf TEXT,
ADD COLUMN IF NOT EXISTS emitente_cep TEXT,
ADD COLUMN IF NOT EXISTS emitente_telefone TEXT,
ADD COLUMN IF NOT EXISTS emitente_email TEXT;

-- Adicionar campos de transportadora
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS transportadora_id UUID REFERENCES transportadoras(id),
ADD COLUMN IF NOT EXISTS transportadora_nome TEXT,
ADD COLUMN IF NOT EXISTS transportadora_cnpj TEXT,
ADD COLUMN IF NOT EXISTS transportadora_ie TEXT,
ADD COLUMN IF NOT EXISTS transportadora_endereco TEXT,
ADD COLUMN IF NOT EXISTS transportadora_municipio TEXT,
ADD COLUMN IF NOT EXISTS transportadora_uf TEXT;

-- Adicionar campos de entrega (local de entrega diferente do destinatário)
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS entrega_nome TEXT,
ADD COLUMN IF NOT EXISTS entrega_cnpj TEXT,
ADD COLUMN IF NOT EXISTS entrega_logradouro TEXT,
ADD COLUMN IF NOT EXISTS entrega_numero TEXT,
ADD COLUMN IF NOT EXISTS entrega_complemento TEXT,
ADD COLUMN IF NOT EXISTS entrega_bairro TEXT,
ADD COLUMN IF NOT EXISTS entrega_municipio TEXT,
ADD COLUMN IF NOT EXISTS entrega_uf TEXT,
ADD COLUMN IF NOT EXISTS entrega_cep TEXT,
ADD COLUMN IF NOT EXISTS entrega_telefone TEXT;

-- Adicionar campos fiscais/NF-e adicionais
ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS numero_nfe TEXT,
ADD COLUMN IF NOT EXISTS serie_nfe TEXT,
ADD COLUMN IF NOT EXISTS chave_nfe TEXT,
ADD COLUMN IF NOT EXISTS natureza_operacao TEXT,
ADD COLUMN IF NOT EXISTS modalidade_frete TEXT,
ADD COLUMN IF NOT EXISTS valor_produtos NUMERIC,
ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC,
ADD COLUMN IF NOT EXISTS valor_frete NUMERIC,
ADD COLUMN IF NOT EXISTS valor_seguro NUMERIC,
ADD COLUMN IF NOT EXISTS valor_outras_despesas NUMERIC,
ADD COLUMN IF NOT EXISTS peso_bruto NUMERIC,
ADD COLUMN IF NOT EXISTS peso_liquido NUMERIC,
ADD COLUMN IF NOT EXISTS quantidade_volumes INTEGER;

-- Comentários para documentação
COMMENT ON COLUMN public.saidas.emitente_nome IS 'Razão social do emitente da saída';
COMMENT ON COLUMN public.saidas.emitente_cnpj IS 'CNPJ do emitente';
COMMENT ON COLUMN public.saidas.transportadora_nome IS 'Nome da transportadora';
COMMENT ON COLUMN public.saidas.entrega_nome IS 'Nome do local de entrega (se diferente do destinatário)';
COMMENT ON COLUMN public.saidas.numero_nfe IS 'Número da NF-e gerada';
COMMENT ON COLUMN public.saidas.chave_nfe IS 'Chave de acesso da NF-e';