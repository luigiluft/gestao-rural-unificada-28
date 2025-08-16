-- Primeiro, garantir que todos os registros tenham status_aprovacao preenchido
-- Migrar dados do status para status_aprovacao se necessário
UPDATE entradas 
SET status_aprovacao = CASE 
  WHEN status_aprovacao IS NULL AND status IS NOT NULL THEN 
    CASE 
      WHEN status = 'processando' THEN 'aguardando_transporte'::entrada_status
      WHEN status = 'aguardando_transporte' THEN 'aguardando_transporte'::entrada_status
      WHEN status = 'confirmado' THEN 'confirmado'::entrada_status
      ELSE 'aguardando_transporte'::entrada_status
    END
  ELSE status_aprovacao
END
WHERE status_aprovacao IS NULL;

-- Remover a coluna status redundante da tabela entradas
ALTER TABLE entradas DROP COLUMN IF EXISTS status;