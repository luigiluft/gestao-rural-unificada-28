-- Reset allocation wave status to 'posicoes_definidas' for testing
UPDATE allocation_waves 
SET 
  status = 'posicoes_definidas',
  data_inicio = NULL,
  funcionario_id = NULL
WHERE id = 'cee3dab1-8f12-4c72-b3c2-f988b70dd68a';

-- Reset allocation wave items to 'pendente' status
UPDATE allocation_wave_items 
SET 
  status = 'pendente',
  data_alocacao = NULL,
  alocado_por = NULL,
  quantidade_alocada = 0
WHERE wave_id = 'cee3dab1-8f12-4c72-b3c2-f988b70dd68a';

-- Reset storage positions to available (not occupied)
UPDATE storage_positions 
SET ocupado = false 
WHERE id IN (
  SELECT posicao_id 
  FROM allocation_wave_items 
  WHERE wave_id = 'cee3dab1-8f12-4c72-b3c2-f988b70dd68a' 
  AND posicao_id IS NOT NULL
);