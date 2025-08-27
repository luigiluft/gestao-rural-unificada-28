-- Fix the create_stock_from_pallet function to use correct ON CONFLICT syntax for index
CREATE OR REPLACE FUNCTION create_stock_from_pallet(
  p_pallet_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entrada RECORD;
  v_item RECORD;
  v_pallet_position RECORD;
BEGIN
  -- Get pallet position info
  SELECT pp.*, ep.entrada_id
  INTO v_pallet_position
  FROM pallet_positions pp
  JOIN entrada_pallets ep ON ep.id = pp.pallet_id
  WHERE pp.pallet_id = p_pallet_id AND pp.status = 'alocado';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pallet não encontrado ou não alocado';
  END IF;
  
  -- Get entrada info
  SELECT e.*, p.user_id
  INTO v_entrada
  FROM entradas e
  JOIN profiles p ON p.user_id = e.user_id
  WHERE e.id = v_pallet_position.entrada_id;
  
  -- Process each item in the pallet
  FOR v_item IN
    SELECT 
      ei.*,
      epi.quantidade as quantidade_pallet
    FROM entrada_pallet_itens epi
    JOIN entrada_itens ei ON ei.id = epi.entrada_item_id
    WHERE epi.pallet_id = p_pallet_id
  LOOP
    -- Create or update stock using correct ON CONFLICT syntax for the existing index
    INSERT INTO estoque (
      user_id,
      produto_id,
      deposito_id,
      quantidade_atual,
      quantidade_reservada,
      valor_medio,
      lote,
      data_validade,
      updated_at
    ) VALUES (
      v_entrada.user_id,
      v_item.produto_id,
      v_entrada.deposito_id,
      v_item.quantidade_pallet,
      0,
      COALESCE(v_item.valor_unitario, 0),
      v_item.lote,
      v_item.data_validade,
      now()
    )
    ON CONFLICT ON CONSTRAINT idx_estoque_unique
    DO UPDATE SET 
      quantidade_atual = estoque.quantidade_atual + v_item.quantidade_pallet,
      valor_medio = CASE 
        WHEN estoque.quantidade_atual > 0 THEN 
          ((estoque.valor_medio * estoque.quantidade_atual) + (COALESCE(v_item.valor_unitario, 0) * v_item.quantidade_pallet)) / (estoque.quantidade_atual + v_item.quantidade_pallet)
        ELSE 
          COALESCE(v_item.valor_unitario, 0)
      END,
      updated_at = now();
      
    -- Create movement record
    INSERT INTO movimentacoes (
      user_id,
      produto_id,
      deposito_id,
      tipo_movimentacao,
      quantidade,
      valor_unitario,
      referencia_id,
      referencia_tipo,
      lote,
      observacoes,
      data_movimentacao
    ) VALUES (
      v_entrada.user_id,
      v_item.produto_id,
      v_entrada.deposito_id,
      'entrada',
      v_item.quantidade_pallet,
      v_item.valor_unitario,
      p_pallet_id,
      'pallet',
      v_item.lote,
      'Entrada de estoque via alocação de pallet - Posição: ' || v_pallet_position.posicao_id,
      now()
    );
  END LOOP;
  
  RETURN TRUE;
END;
$$;