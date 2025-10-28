-- Associar Fazenda Bugalhau às saídas órfãs do produtor João Silva
UPDATE saidas
SET
  fazenda_id = '3099c99f-cf68-4418-9713-e93a15245e32',
  updated_at = NOW()
WHERE
  user_id = '1cbac1cb-f639-4fb0-8b56-9dd3e1273e22'
  AND fazenda_id IS NULL
  AND tipo_saida = 'entrega_fazenda';