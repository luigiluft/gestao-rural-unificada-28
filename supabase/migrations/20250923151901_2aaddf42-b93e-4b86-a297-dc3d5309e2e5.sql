-- Update existing remessas that don't have delivery window dates
UPDATE saidas 
SET 
  data_inicio_janela = '2024-09-30',
  data_fim_janela = '2024-10-07'
WHERE 
  data_inicio_janela IS NULL 
  OR data_fim_janela IS NULL;