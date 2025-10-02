-- Corrigir search_path da função validar_e_alocar_estoque_fefo para segurança
CREATE OR REPLACE FUNCTION public.validar_e_alocar_estoque_fefo(
  p_produto_id UUID,
  p_deposito_id UUID,
  p_quantidade_necessaria NUMERIC,
  p_saida_item_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entrada_item RECORD;
  v_quantidade_restante NUMERIC := p_quantidade_necessaria;
  v_quantidade_a_alocar NUMERIC;
  v_quantidade_disponivel NUMERIC;
  v_referencias JSONB := '[]'::jsonb;
BEGIN
  -- Buscar itens de entrada disponíveis ordenados por FEFO (First-Expired, First-Out)
  FOR v_entrada_item IN
    SELECT 
      ei.id,
      ei.entrada_id,
      ei.lote,
      ei.data_validade,
      ei.quantidade,
      -- Calcular quantidade já alocada
      COALESCE((
        SELECT SUM(sir.quantidade)
        FROM public.saida_item_referencias sir
        WHERE sir.entrada_item_id = ei.id
      ), 0) as quantidade_alocada
    FROM public.entrada_itens ei
    JOIN public.entradas e ON e.id = ei.entrada_id
    WHERE ei.produto_id = p_produto_id
      AND e.deposito_id = p_deposito_id
      AND e.status_aprovacao = 'confirmado'
    ORDER BY 
      COALESCE(ei.data_validade, '2099-12-31'::date) ASC,  -- FEFO: primeiro os que vencem antes
      ei.created_at ASC  -- Em caso de mesma validade, FIFO
  LOOP
    -- Calcular quantidade disponível neste lote
    v_quantidade_disponivel := v_entrada_item.quantidade - v_entrada_item.quantidade_alocada;
    
    -- Se não há quantidade disponível, pular para próximo
    IF v_quantidade_disponivel <= 0 THEN
      CONTINUE;
    END IF;
    
    -- Determinar quanto alocar deste lote
    v_quantidade_a_alocar := LEAST(v_quantidade_disponivel, v_quantidade_restante);
    
    -- Criar referência
    INSERT INTO public.saida_item_referencias (
      saida_item_id,
      entrada_item_id,
      quantidade,
      lote,
      data_validade
    ) VALUES (
      p_saida_item_id,
      v_entrada_item.id,
      v_quantidade_a_alocar,
      v_entrada_item.lote,
      v_entrada_item.data_validade
    );
    
    -- Adicionar à lista de referências para retorno
    v_referencias := v_referencias || jsonb_build_object(
      'entrada_item_id', v_entrada_item.id,
      'entrada_id', v_entrada_item.entrada_id,
      'lote', v_entrada_item.lote,
      'data_validade', v_entrada_item.data_validade,
      'quantidade_alocada', v_quantidade_a_alocar
    );
    
    -- Reduzir quantidade restante
    v_quantidade_restante := v_quantidade_restante - v_quantidade_a_alocar;
    
    -- Se já alocamos tudo, sair do loop
    EXIT WHEN v_quantidade_restante <= 0;
  END LOOP;
  
  -- Se ainda falta quantidade, retornar erro
  IF v_quantidade_restante > 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente. Necessário: %, Disponível: %', 
      p_quantidade_necessaria, 
      p_quantidade_necessaria - v_quantidade_restante;
  END IF;
  
  -- Retornar sucesso com detalhes das alocações
  RETURN jsonb_build_object(
    'success', true,
    'quantidade_total', p_quantidade_necessaria,
    'referencias', v_referencias
  );
END;
$$;