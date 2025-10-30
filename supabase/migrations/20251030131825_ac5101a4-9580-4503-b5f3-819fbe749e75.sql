-- Fase 1: Corrigir posições ocupadas sem pallet alocado
UPDATE storage_positions
SET ocupado = false,
    updated_at = now()
WHERE ocupado = true
  AND NOT EXISTS (
    SELECT 1 FROM pallet_positions pp
    WHERE pp.posicao_id = storage_positions.id 
    AND pp.status = 'alocado'
  );