-- Recriar função com colunas corretas
DROP FUNCTION IF EXISTS public.process_saida_items(uuid);

CREATE OR REPLACE FUNCTION public.process_saida_items(p_saida_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  saida_rec RECORD;
  item_rec RECORD;
  mov_id UUID;
BEGIN
  -- Buscar a saída
  SELECT * INTO saida_rec FROM public.saidas WHERE id = p_saida_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saída não encontrada: %', p_saida_id;
  END IF;

  RAISE LOG 'Processando saída ID: %', p_saida_id;

  -- Verificar se já existem movimentações para esta saída
  IF EXISTS (
    SELECT 1 FROM public.movimentacoes 
    WHERE referencia_tipo = 'saida' 
    AND referencia_id::text IN (
      SELECT id::text FROM public.saida_itens WHERE saida_id = p_saida_id
    )
  ) THEN
    RAISE LOG 'Saída % já possui movimentações, pulando processamento', p_saida_id;
    RETURN;
  END IF;

  -- Processar cada item da saída
  FOR item_rec IN
    SELECT 
      si.id,
      si.produto_id,
      si.quantidade,
      si.lote,
      si.valor_unitario
    FROM public.saida_itens si
    WHERE si.saida_id = p_saida_id
  LOOP
    -- Criar movimentação de saída (quantidade negativa)
    INSERT INTO public.movimentacoes (
      user_id,
      deposito_id,
      produto_id,
      tipo_movimentacao,
      quantidade,
      lote,
      valor_unitario,
      data_movimentacao,
      referencia_tipo,
      referencia_id
    ) VALUES (
      saida_rec.user_id,
      saida_rec.deposito_id,
      item_rec.produto_id,
      'saida',
      -ABS(item_rec.quantidade), -- Garantir quantidade negativa
      item_rec.lote,
      item_rec.valor_unitario,
      saida_rec.data_saida,
      'saida',
      item_rec.id
    ) RETURNING id INTO mov_id;

    RAISE LOG 'Movimentação % criada para item %', mov_id, item_rec.id;
  END LOOP;

  RAISE LOG 'Saída % processada com sucesso', p_saida_id;
END;
$$;

-- Processar saídas órfãs
SELECT process_saida_items(id) 
FROM public.saidas 
WHERE status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel')
ORDER BY created_at ASC
LIMIT 50;