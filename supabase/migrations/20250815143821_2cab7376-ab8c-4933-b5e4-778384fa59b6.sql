-- Adicionar campos para informações do emitente na tabela entradas
ALTER TABLE public.entradas 
ADD COLUMN IF NOT EXISTS emitente_nome text,
ADD COLUMN IF NOT EXISTS emitente_cnpj text,
ADD COLUMN IF NOT EXISTS emitente_endereco text;