-- Remover o check constraint do campo tipo
ALTER TABLE public.tabelas_frete 
DROP CONSTRAINT IF EXISTS tabelas_frete_tipo_check;

-- Tornar o campo tipo nullable (opcional)
ALTER TABLE public.tabelas_frete 
ALTER COLUMN tipo DROP NOT NULL;

-- Comentário: O tipo não é mais obrigatório pois a distinção será feita pelo nome da tabela