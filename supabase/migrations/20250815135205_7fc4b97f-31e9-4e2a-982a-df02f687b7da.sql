-- Adicionar campos da NFe na tabela entradas
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS serie TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS natureza_operacao TEXT;

-- Adicionar campos do fornecedor na tabela fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;