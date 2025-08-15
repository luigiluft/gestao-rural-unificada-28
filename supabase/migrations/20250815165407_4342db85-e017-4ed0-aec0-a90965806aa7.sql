-- Adicionar campo para CPF/CNPJ do destinatário na tabela entradas
ALTER TABLE public.entradas 
ADD COLUMN destinatario_cpf_cnpj text;

-- Adicionar índice para facilitar busca do produtor
CREATE INDEX idx_entradas_destinatario_cpf_cnpj 
ON public.entradas(destinatario_cpf_cnpj);

-- Adicionar índice na tabela profiles para busca por CPF/CNPJ
CREATE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj 
ON public.profiles(cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL;