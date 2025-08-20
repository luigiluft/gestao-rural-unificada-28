-- Criar posições de teste para a franquia BARUERI-01
INSERT INTO public.storage_positions (
  deposito_id,
  codigo,
  descricao,
  tipo_posicao,
  ativo,
  ocupado
) VALUES 
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R01-M01-A01', 'Rua 1, Módulo 1, Andar 1', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R01-M01-A02', 'Rua 1, Módulo 1, Andar 2', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R01-M02-A01', 'Rua 1, Módulo 2, Andar 1', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R01-M02-A02', 'Rua 1, Módulo 2, Andar 2', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R02-M01-A01', 'Rua 2, Módulo 1, Andar 1', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R02-M01-A02', 'Rua 2, Módulo 1, Andar 2', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R02-M02-A01', 'Rua 2, Módulo 2, Andar 1', 'prateleira', true, false),
  ('75edbf21-1efa-4397-8d0c-dddca9d572aa', 'R02-M02-A02', 'Rua 2, Módulo 2, Andar 2', 'prateleira', true, false);