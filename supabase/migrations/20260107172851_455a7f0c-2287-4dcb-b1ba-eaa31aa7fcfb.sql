-- Adicionar campo entrada_gerada_id na tabela saidas para rastreabilidade bidirecional
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS entrada_gerada_id uuid REFERENCES entradas(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_saidas_entrada_gerada ON saidas(entrada_gerada_id);

-- Comentário para documentação
COMMENT ON COLUMN saidas.entrada_gerada_id IS 'ID da entrada gerada automaticamente quando a saída é para cliente interno';