-- Fix create_stock_from_pallet function with explicit public schema references
CREATE OR REPLACE FUNCTION public.create_stock_from_pallet(p_pallet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_entrada RECORD;
  v_item RECORD;
  v_pallet_position RECORD;
BEGIN
  -- Get pallet position info with explicit schema
  SELECT pp.*, ep.entrada_id
  INTO v_pallet_position
  FROM public.pallet_positions pp
  JOIN public.entrada_pallets ep ON ep.id = pp.pallet_id
  WHERE pp.pallet_id = p_pallet_id AND pp.status = 'alocado';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pallet não encontrado ou não alocado';
  END IF;
  
  -- Get entrada info with explicit schema
  SELECT e.*, p.user_id
  INTO v_entrada
  FROM public.entradas e
  JOIN public.profiles p ON p.user_id = e.user_id
  WHERE e.id = v_pallet_position.entrada_id;
  
  -- Process each item in the pallet with explicit schema
  FOR v_item IN
    SELECT 
      ei.*,
      epi.quantidade as quantidade_pallet
    FROM public.entrada_pallet_itens epi
    JOIN public.entrada_itens ei ON ei.id = epi.entrada_item_id
    WHERE epi.pallet_id = p_pallet_id
  LOOP
    -- Criar registro de movimentação com explicit schema
    INSERT INTO public.movimentacoes (
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

-- Also fix allocate_pallet_to_position with explicit schema
CREATE OR REPLACE FUNCTION public.allocate_pallet_to_position(
  p_pallet_id uuid,
  p_position_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_allocation_id uuid;
BEGIN
  -- Mark position as occupied with explicit schema
  UPDATE public.storage_positions
  SET ocupada = true
  WHERE id = p_position_id;
  
  -- Create pallet position record with explicit schema
  INSERT INTO public.pallet_positions (
    pallet_id,
    posicao_id,
    status,
    data_alocacao
  ) VALUES (
    p_pallet_id,
    p_position_id,
    'alocado',
    now()
  )
  RETURNING id INTO v_allocation_id;
  
  -- Update pallet status with explicit schema
  UPDATE public.entrada_pallets
  SET status = 'alocado'
  WHERE id = p_pallet_id;
  
  RETURN v_allocation_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_stock_from_pallet(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_pallet_to_position(uuid, uuid) TO authenticated;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';