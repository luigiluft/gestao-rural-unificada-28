-- Adicionar colunas latitude e longitude na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);