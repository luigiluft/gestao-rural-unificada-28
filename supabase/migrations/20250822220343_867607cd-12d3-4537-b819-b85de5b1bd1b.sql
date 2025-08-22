-- Corrigir posições marcadas como ocupadas incorretamente
UPDATE storage_positions 
SET ocupado = false 
WHERE id IN (
  SELECT sp.id 
  FROM storage_positions sp
  LEFT JOIN allocation_wave_items awi ON awi.posicao_id = sp.id AND awi.status = 'alocado'
  WHERE sp.ocupado = true 
  GROUP BY sp.id 
  HAVING COUNT(awi.id) = 0
);