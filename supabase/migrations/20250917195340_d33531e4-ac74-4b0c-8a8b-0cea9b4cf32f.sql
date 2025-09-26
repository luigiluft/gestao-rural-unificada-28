-- Migrate data from inventario_divergencias to divergencias table
-- First, insert any existing data from inventario_divergencias into divergencias
-- Note: diferenca is a generated column, so we exclude it from the INSERT
INSERT INTO public.divergencias (
  user_id,
  deposito_id,
  tipo_origem,
  inventario_id,
  produto_id,
  posicao_id,
  lote,
  quantidade_esperada,
  quantidade_encontrada,
  tipo_divergencia,
  justificativa,
  valor_impacto,
  status,
  created_at
)
SELECT 
  (SELECT user_id FROM inventarios WHERE id = id_div.inventario_id LIMIT 1) as user_id,
  (SELECT deposito_id FROM inventarios WHERE id = id_div.inventario_id LIMIT 1) as deposito_id,
  'inventario' as tipo_origem,
  id_div.inventario_id,
  id_div.produto_id,
  id_div.posicao_id,
  id_div.lote,
  id_div.quantidade_sistema as quantidade_esperada,
  id_div.quantidade_encontrada,
  id_div.tipo_divergencia,
  id_div.justificativa,
  id_div.valor_impacto,
  id_div.status,
  id_div.created_at
FROM public.inventario_divergencias id_div;

-- Drop the redundant inventario_divergencias table
DROP TABLE IF EXISTS public.inventario_divergencias;

-- Add a comment to document the unified approach
COMMENT ON TABLE public.divergencias IS 'Unified table for all types of divergences: inventory, entry, exit, and pallet-related discrepancies';