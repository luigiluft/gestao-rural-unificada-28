-- Update existing saidas that don't have delivery window dates
-- Calculate based on data_saida and janela_entrega_dias
UPDATE saidas 
SET 
  data_inicio_janela = data_saida,
  data_fim_janela = data_saida + INTERVAL '1 day' * COALESCE(janela_entrega_dias, 3) - INTERVAL '1 day'
WHERE 
  data_inicio_janela IS NULL 
  OR data_fim_janela IS NULL;