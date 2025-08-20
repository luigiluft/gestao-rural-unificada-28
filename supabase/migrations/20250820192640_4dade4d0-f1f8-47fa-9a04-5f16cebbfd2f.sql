-- 1. Executar alocação automática para ondas sem posições definidas
SELECT public.auto_allocate_positions('3f8a8229-264e-4397-9743-4c68e2db6742');

-- 2. Corrigir status das ondas baseado no estado dos itens
UPDATE allocation_waves
SET status = CASE 
  WHEN (
    SELECT COUNT(*) = COUNT(CASE WHEN awi.status = 'alocado' THEN 1 END)
    FROM allocation_wave_items awi 
    WHERE awi.wave_id = allocation_waves.id
    AND (SELECT COUNT(*) FROM allocation_wave_items WHERE wave_id = allocation_waves.id) > 0
  ) THEN 'concluida'
  WHEN (
    SELECT COUNT(*) = COUNT(CASE WHEN awi.posicao_id IS NOT NULL THEN 1 END)
    FROM allocation_wave_items awi 
    WHERE awi.wave_id = allocation_waves.id
    AND (SELECT COUNT(*) FROM allocation_wave_items WHERE wave_id = allocation_waves.id) > 0
  ) THEN 'posicoes_definidas'
  ELSE status
END
WHERE status = 'pendente';

-- 3. Atualizar data_conclusao para ondas concluídas
UPDATE allocation_waves 
SET data_conclusao = now()
WHERE status = 'concluida' AND data_conclusao IS NULL;