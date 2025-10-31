-- Adicionar coluna data_fechamento se não existir
ALTER TABLE faturas 
ADD COLUMN IF NOT EXISTS data_fechamento timestamp with time zone;

-- Adicionar coluna fechada_por se não existir
ALTER TABLE faturas 
ADD COLUMN IF NOT EXISTS fechada_por uuid;

-- Adicionar foreign key para fechada_por se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'faturas_fechada_por_fkey'
    ) THEN
        ALTER TABLE faturas 
        ADD CONSTRAINT faturas_fechada_por_fkey 
        FOREIGN KEY (fechada_por) REFERENCES auth.users(id);
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_contrato_periodo ON faturas(contrato_id, periodo_inicio, periodo_fim);

-- Atualizar faturas antigas para status 'pendente' se estiverem com 'rascunho'
-- (assumindo que faturas antigas já devem estar fechadas)
UPDATE faturas 
SET status = 'pendente', 
    data_fechamento = created_at
WHERE status = 'rascunho' 
  AND created_at < NOW() - INTERVAL '1 day';