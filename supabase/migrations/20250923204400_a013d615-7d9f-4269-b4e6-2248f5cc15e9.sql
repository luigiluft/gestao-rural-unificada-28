-- Create the main freight table for Fernando Moreirra with correct tipo
INSERT INTO public.tabelas_frete (
  user_id,
  franqueado_id,
  nome,
  tipo,
  origem,
  data_vigencia,
  valor_base,
  ativo
) VALUES (
  'a695e2b8-a539-4374-ba04-8c2055c485ea',
  'a695e2b8-a539-4374-ba04-8c2055c485ea',
  'Tabela Regional Padrão',
  'distancia',
  'São Paulo - SP',
  CURRENT_DATE,
  0,
  true
);

-- Get the inserted table ID and insert all freight ranges
WITH tabela_id AS (
  SELECT id FROM public.tabelas_frete 
  WHERE franqueado_id = 'a695e2b8-a539-4374-ba04-8c2055c485ea' 
  AND nome = 'Tabela Regional Padrão'
  LIMIT 1
)
INSERT INTO public.frete_faixas (
  tabela_frete_id,
  distancia_min,
  distancia_max,
  valor_ate_300kg,
  valor_por_kg_301_999,
  pedagio_por_ton,
  prazo_dias
) 
SELECT 
  tabela_id.id,
  ranges.distancia_min,
  ranges.distancia_max,
  ranges.valor_ate_300kg,
  ranges.valor_por_kg_301_999,
  ranges.pedagio_por_ton,
  ranges.prazo_dias
FROM tabela_id,
(VALUES 
  (0, 50, 250.00, 0.80, 5.00, 3),
  (51, 150, 300.00, 1.00, 10.00, 4),
  (151, 300, 400.00, 1.20, 15.00, 5),
  (301, 500, 550.00, 1.40, 20.00, 6),
  (501, 800, 750.00, 1.60, 25.00, 7),
  (801, 1200, 1000.00, 1.80, 30.00, 8),
  (1201, 1600, 1300.00, 2.00, 35.00, 9),
  (1601, 2000, 1600.00, 2.20, 40.00, 10),
  (2001, 2500, 2000.00, 2.40, 45.00, 11),
  (2501, 3000, 2500.00, 2.60, 50.00, 12)
) AS ranges(distancia_min, distancia_max, valor_ate_300kg, valor_por_kg_301_999, pedagio_por_ton, prazo_dias);