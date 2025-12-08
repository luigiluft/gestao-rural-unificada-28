-- Adicionar campos para habilitar E-commerce e Atendimento
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS ecommerce_habilitado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS atendimento_habilitado boolean DEFAULT false;