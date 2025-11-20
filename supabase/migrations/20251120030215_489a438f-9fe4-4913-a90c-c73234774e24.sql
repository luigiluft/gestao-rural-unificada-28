-- Fase 1: Remover a constraint restritiva
ALTER TABLE public.franquias
DROP CONSTRAINT IF EXISTS check_tipo_deposito_franqueado;

-- Adicionar constraint mais flexível apenas para validar o tipo
ALTER TABLE public.franquias
ADD CONSTRAINT check_tipo_deposito_valid
CHECK (tipo_deposito IN ('franquia', 'filial'));

-- Garantir que master_franqueado_id possa ser NULL
ALTER TABLE public.franquias
ALTER COLUMN master_franqueado_id DROP NOT NULL;