-- Fix all saidas records with incorrect 2024 dates
-- Update them to use correct dates based on data_saida
UPDATE saidas 
SET 
  data_inicio_janela = data_saida,
  data_fim_janela = data_saida + INTERVAL '1 day' * COALESCE(janela_entrega_dias, 3) - INTERVAL '1 day'
WHERE 
  (data_inicio_janela::text LIKE '2024%' OR data_fim_janela::text LIKE '2024%')
  AND data_saida::text LIKE '2025%';