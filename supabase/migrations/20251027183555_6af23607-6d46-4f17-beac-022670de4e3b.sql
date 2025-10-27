-- Dropar função existente se houver
DROP FUNCTION IF EXISTS public.process_saida_items(uuid);

-- Criar função para processar itens de saída e criar movimentações
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

  RAISE LOG 'Processando saída % (ID: %)', saida_rec.numero_saida, p_saida_id;

  -- Verificar se já existem movimentações para esta saída
  IF EXISTS (SELECT 1 FROM public.movimentacoes WHERE saida_id = p_saida_id) THEN
    RAISE LOG 'Saída % já possui movimentações, pulando processamento', saida_rec.numero_saida;
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
      valor_total,
      data_movimentacao,
      saida_id,
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
      -(ABS(item_rec.quantidade) * COALESCE(item_rec.valor_unitario, 0)),
      saida_rec.data_saida,
      p_saida_id,
      'saida',
      item_rec.id
    ) RETURNING id INTO mov_id;

    RAISE LOG 'Movimentação % criada para item % da saída %', mov_id, item_rec.id, saida_rec.numero_saida;
  END LOOP;

  RAISE LOG 'Saída % processada com sucesso', saida_rec.numero_saida;
END;
$$;

-- Criar função wrapper para o trigger
CREATE OR REPLACE FUNCTION public.trigger_process_saida_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Chamar a função de processamento
  PERFORM process_saida_items(NEW.id);
  RETURN NEW;
END;
$$;

-- Recriar trigger para processar saídas automaticamente
DROP TRIGGER IF EXISTS trigger_process_saida_on_insert ON public.saidas;

CREATE TRIGGER trigger_process_saida_on_insert
  AFTER INSERT ON public.saidas
  FOR EACH ROW
  WHEN (NEW.status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel'))
  EXECUTE FUNCTION trigger_process_saida_on_insert();