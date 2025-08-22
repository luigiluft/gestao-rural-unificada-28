-- Atualizar onda específica que deveria estar concluída
UPDATE public.allocation_waves 
SET 
  status = 'concluido',
  data_conclusao = now()
WHERE id = 'e8ca6329-9ed2-4f98-95e0-6f6d93e129f0'
  AND NOT EXISTS (
    SELECT 1 FROM public.allocation_wave_items 
    WHERE wave_id = 'e8ca6329-9ed2-4f98-95e0-6f6d93e129f0' 
    AND status = 'pendente'
  );