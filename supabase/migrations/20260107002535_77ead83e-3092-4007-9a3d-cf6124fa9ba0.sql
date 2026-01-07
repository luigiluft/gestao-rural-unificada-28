-- Fase 2.1: Adicionar campo tipo_empresa na tabela clientes
-- Define os tipos de empresa que podem usar a plataforma

ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS tipo_empresa TEXT DEFAULT 'comercial';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_tipo_empresa_check 
CHECK (tipo_empresa IN ('comercial', 'armazenagem', 'transportadora', 'produtor_rural'));

-- Criar índice para facilitar buscas por tipo
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_empresa ON public.clientes(tipo_empresa);

-- Comentário para documentação
COMMENT ON COLUMN public.clientes.tipo_empresa IS 'Tipo de empresa: comercial (padrão), armazenagem (operador logístico), transportadora, produtor_rural';