-- Fase 2: Normalizar códigos de posição para formato R##-M##-A##
-- Primeiro, identificar e remover duplicatas (manter apenas o formato com 2 dígitos se existir)
WITH duplicates AS (
  SELECT 
    id,
    codigo,
    CONCAT(
      SUBSTRING(codigo FROM 'R\d{2}'),
      '-',
      SUBSTRING(codigo FROM 'M\d{2}'),
      '-A',
      LPAD(SUBSTRING(codigo FROM 'A(\d+)'), 2, '0')
    ) as codigo_normalizado,
    ROW_NUMBER() OVER (
      PARTITION BY deposito_id, CONCAT(
        SUBSTRING(codigo FROM 'R\d{2}'),
        '-',
        SUBSTRING(codigo FROM 'M\d{2}'),
        '-A',
        LPAD(SUBSTRING(codigo FROM 'A(\d+)'), 2, '0')
      ) 
      ORDER BY 
        CASE WHEN codigo ~ '^R\d{2}-M\d{2}-A\d{2}$' THEN 1 ELSE 2 END,
        created_at DESC
    ) as rn
  FROM storage_positions
  WHERE codigo ~ '^R\d{2}-M\d{2}-A\d{1,2}$'
)
DELETE FROM storage_positions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora normalizar os códigos restantes com 1 dígito no andar
UPDATE storage_positions
SET codigo = CONCAT(
    SUBSTRING(codigo FROM 'R\d{2}'),
    '-',
    SUBSTRING(codigo FROM 'M\d{2}'),
    '-A',
    LPAD(SUBSTRING(codigo FROM 'A(\d+)'), 2, '0')
),
updated_at = now()
WHERE codigo ~ '^R\d{2}-M\d{2}-A\d{1}$';