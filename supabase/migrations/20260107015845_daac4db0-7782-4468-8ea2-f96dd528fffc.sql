-- Adicionar campos de destinatário na tabela saidas
-- Esses campos armazenam os dados do cliente destinatário no momento da criação da saída

ALTER TABLE public.saidas 
ADD COLUMN IF NOT EXISTS destinatario_nome TEXT,
ADD COLUMN IF NOT EXISTS destinatario_cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS destinatario_ie TEXT,
ADD COLUMN IF NOT EXISTS destinatario_logradouro TEXT,
ADD COLUMN IF NOT EXISTS destinatario_numero TEXT,
ADD COLUMN IF NOT EXISTS destinatario_complemento TEXT,
ADD COLUMN IF NOT EXISTS destinatario_bairro TEXT,
ADD COLUMN IF NOT EXISTS destinatario_municipio TEXT,
ADD COLUMN IF NOT EXISTS destinatario_uf TEXT,
ADD COLUMN IF NOT EXISTS destinatario_cep TEXT,
ADD COLUMN IF NOT EXISTS destinatario_telefone TEXT,
ADD COLUMN IF NOT EXISTS destinatario_email TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.saidas.destinatario_nome IS 'Razão social/nome do cliente destinatário';
COMMENT ON COLUMN public.saidas.destinatario_cpf_cnpj IS 'CPF ou CNPJ do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_ie IS 'Inscrição Estadual do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_logradouro IS 'Logradouro do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_numero IS 'Número do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_complemento IS 'Complemento do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_bairro IS 'Bairro do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_municipio IS 'Município do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_uf IS 'UF do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_cep IS 'CEP do endereço fiscal do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_telefone IS 'Telefone do destinatário';
COMMENT ON COLUMN public.saidas.destinatario_email IS 'Email do destinatário';