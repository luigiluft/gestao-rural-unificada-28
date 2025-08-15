-- Limpar produtos duplicados mantendo apenas o mais recente de cada grupo
WITH duplicates AS (
  SELECT 
    id,
    nome,
    codigo,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY nome, COALESCE(codigo, ''), user_id 
      ORDER BY created_at DESC
    ) as row_num
  FROM produtos 
  WHERE ativo = true
)
UPDATE produtos 
SET ativo = false 
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);