
-- Corrigir get_estoque_from_movimentacoes para agrupar corretamente sem separar por user_id
DROP FUNCTION IF EXISTS public.get_estoque_from_movimentacoes();

CREATE OR REPLACE FUNCTION public.get_estoque_from_movimentacoes()
RETURNS TABLE (
  produto_id uuid,
  deposito_id uuid,
  user_id uuid,
  lote text,
  quantidade_atual numeric,
  valor_unitario numeric,
  valor_total numeric,
  produtos jsonb,
  franquia_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH movimentacoes_consolidadas AS (
    -- Movimentações de pallets (apenas itens NÃO avariados)
    SELECT 
      ei.produto_id,
      e.deposito_id,
      e.user_id,
      COALESCE(ei.lote, '') as lote,
      SUM(epi.quantidade) as quantidade,
      ei.valor_unitario,
      p.nome as produto_nome,
      p.codigo as produto_codigo,
      p.unidade_medida as produto_unidade
    FROM public.entrada_pallets ep
    JOIN public.entradas e ON e.id = ep.entrada_id
    JOIN public.entrada_pallet_itens epi ON epi.pallet_id = ep.id
    JOIN public.entrada_itens ei ON ei.id = epi.entrada_item_id
    JOIN public.produtos p ON p.id = ei.produto_id
    JOIN public.pallet_positions pp ON pp.pallet_id = ep.id
    WHERE pp.status = 'alocado'
      AND epi.is_avaria = false
    GROUP BY 
      ei.produto_id, 
      e.deposito_id, 
      e.user_id, 
      ei.lote, 
      ei.valor_unitario,
      p.nome,
      p.codigo,
      p.unidade_medida
    
    UNION ALL
    
    -- Movimentações de allocation_wave
    SELECT 
      m.produto_id,
      m.deposito_id,
      m.user_id,
      COALESCE(m.lote, '') as lote,
      SUM(m.quantidade) as quantidade,
      m.valor_unitario,
      p.nome as produto_nome,
      p.codigo as produto_codigo,
      p.unidade_medida as produto_unidade
    FROM public.movimentacoes m
    JOIN public.produtos p ON p.id = m.produto_id
    WHERE m.referencia_tipo = 'allocation_wave'
      AND m.tipo_movimentacao = 'entrada'
    GROUP BY 
      m.produto_id,
      m.deposito_id,
      m.user_id,
      m.lote,
      m.valor_unitario,
      p.nome,
      p.codigo,
      p.unidade_medida
    
    UNION ALL
    
    -- Movimentações de saída (quantidade negativa)
    SELECT 
      m.produto_id,
      m.deposito_id,
      m.user_id,
      COALESCE(m.lote, '') as lote,
      SUM(m.quantidade) as quantidade,
      m.valor_unitario,
      p.nome as produto_nome,
      p.codigo as produto_codigo,
      p.unidade_medida as produto_unidade
    FROM public.movimentacoes m
    JOIN public.produtos p ON p.id = m.produto_id
    WHERE m.referencia_tipo = 'saida'
      AND m.tipo_movimentacao = 'saida'
    GROUP BY 
      m.produto_id,
      m.deposito_id,
      m.user_id,
      m.lote,
      m.valor_unitario,
      p.nome,
      p.codigo,
      p.unidade_medida
  )
  SELECT 
    mc.produto_id,
    mc.deposito_id,
    -- Usar o user_id do proprietário do produto (primeira entrada)
    (SELECT e.user_id FROM entradas e 
     JOIN entrada_itens ei ON ei.entrada_id = e.id 
     WHERE ei.produto_id = mc.produto_id 
     ORDER BY e.created_at LIMIT 1) as user_id,
    NULLIF(mc.lote, '') as lote,
    SUM(mc.quantidade) as quantidade_atual,
    AVG(mc.valor_unitario) as valor_unitario,
    SUM(mc.quantidade * mc.valor_unitario) as valor_total,
    jsonb_build_object(
      'nome', mc.produto_nome,
      'codigo', mc.produto_codigo,
      'unidade_medida', mc.produto_unidade
    ) as produtos,
    f.nome as franquia_nome
  FROM movimentacoes_consolidadas mc
  LEFT JOIN public.franquias f ON f.id = mc.deposito_id
  GROUP BY 
    mc.produto_id,
    mc.deposito_id,
    mc.lote,
    mc.produto_nome,
    mc.produto_codigo,
    mc.produto_unidade,
    f.nome
  HAVING SUM(mc.quantidade) > 0;
END;
$$;
