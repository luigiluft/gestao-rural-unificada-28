-- Remover coluna inscricao_municipal da tabela clientes
ALTER TABLE public.clientes DROP COLUMN IF EXISTS inscricao_municipal;

-- Atualizar valores existentes de tipo_cliente
UPDATE public.clientes 
SET tipo_cliente = 'cnpj' 
WHERE tipo_cliente = 'empresa';

UPDATE public.clientes 
SET tipo_cliente = 'cpf' 
WHERE tipo_cliente = 'produtor_rural';

-- Atualizar constraint CHECK para aceitar apenas 'cpf' e 'cnpj'
ALTER TABLE public.clientes 
DROP CONSTRAINT IF EXISTS clientes_tipo_cliente_check;

ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_tipo_cliente_check 
CHECK (tipo_cliente IN ('cpf', 'cnpj'));