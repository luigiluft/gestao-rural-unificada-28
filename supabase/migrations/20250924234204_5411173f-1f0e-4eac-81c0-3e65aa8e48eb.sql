-- Corrigir saídas expedidas sem janelas de entrega definidas
-- Definir janela de entrega baseada na data de criação: início em 3 dias e fim em 7 dias

UPDATE public.saidas 
SET 
  data_inicio_janela = (created_at + INTERVAL '3 days')::date,
  data_fim_janela = (created_at + INTERVAL '7 days')::date,
  updated_at = now()
WHERE status = 'expedido' 
  AND (data_inicio_janela IS NULL OR data_fim_janela IS NULL);

-- Log do resultado
DO $$
DECLARE
  registros_corrigidos INTEGER;
BEGIN
  GET DIAGNOSTICS registros_corrigidos = ROW_COUNT;
  RAISE LOG 'Corrigidos % registros de saídas expedidas sem janelas de entrega', registros_corrigidos;
END $$;