-- Adicionar coluna previsao_inicio à tabela viagens
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS previsao_inicio date;

-- Comentários para documentação
COMMENT ON COLUMN viagens.previsao_inicio IS 'Data estimada de início da viagem (planejamento)';
COMMENT ON COLUMN viagens.data_inicio IS 'Data real de início da viagem (quando motorista iniciou)';
COMMENT ON COLUMN viagens.data_fim IS 'Data real de fim da viagem (extraída do comprovante de entrega)';