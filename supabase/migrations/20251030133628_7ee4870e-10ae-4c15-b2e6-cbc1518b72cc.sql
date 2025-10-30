-- Remove all positions from Rua 14 (which seem to be erroneous/separate)
DELETE FROM storage_positions 
WHERE deposito_id = '75edbf21-1efa-4397-8d0c-dddca9d572aa' 
  AND codigo LIKE 'R14-%';

-- Now let's create all missing positions for Ruas 1-7 (complete grid structure)
-- This will create positions for 7 ruas × 25 módulos × 6 andares = 1,050 positions total
INSERT INTO storage_positions (deposito_id, codigo, ocupado, ativo, created_at, updated_at)
SELECT 
  '75edbf21-1efa-4397-8d0c-dddca9d572aa'::uuid as deposito_id,
  'R' || LPAD(r::text, 2, '0') || '-M' || LPAD(m::text, 2, '0') || '-A' || LPAD(a::text, 2, '0') as codigo,
  false as ocupado,
  true as ativo,
  now() as created_at,
  now() as updated_at
FROM 
  generate_series(1, 7) r,
  generate_series(1, 25) m,
  generate_series(1, 6) a
WHERE 'R' || LPAD(r::text, 2, '0') || '-M' || LPAD(m::text, 2, '0') || '-A' || LPAD(a::text, 2, '0') NOT IN (
  SELECT codigo 
  FROM storage_positions 
  WHERE deposito_id = '75edbf21-1efa-4397-8d0c-dddca9d572aa'
);