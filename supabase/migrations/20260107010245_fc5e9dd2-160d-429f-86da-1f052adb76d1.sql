-- Swap status values: confirmado <-> aguardando_transporte
UPDATE entradas
SET status_aprovacao = CASE 
  WHEN status_aprovacao = 'confirmado' THEN 'aguardando_transporte'
  WHEN status_aprovacao = 'aguardando_transporte' THEN 'confirmado'
  ELSE status_aprovacao
END
WHERE status_aprovacao IN ('confirmado', 'aguardando_transporte');