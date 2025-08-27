-- Drop the existing complex allocation system
DROP TABLE IF EXISTS allocation_wave_pallets CASCADE;
DROP TABLE IF EXISTS allocation_wave_items CASCADE;
DROP TABLE IF EXISTS allocation_waves CASCADE;

-- Create simple pallet positions tracking table
CREATE TABLE pallet_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID NOT NULL REFERENCES entrada_pallets(id) ON DELETE CASCADE,
  posicao_id UUID NOT NULL REFERENCES storage_positions(id) ON DELETE CASCADE,
  alocado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  alocado_por UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'alocado' CHECK (status IN ('alocado', 'removido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pallet_id) -- um pallet só pode estar em uma posição
);

-- Enable RLS
ALTER TABLE pallet_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pallet_positions
CREATE POLICY "Users can view pallet positions" 
ON pallet_positions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep
    JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = pallet_positions.pallet_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Users can manage pallet positions" 
ON pallet_positions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep
    JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = pallet_positions.pallet_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep
    JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = pallet_positions.pallet_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
);

-- Function to allocate pallet to position
CREATE OR REPLACE FUNCTION allocate_pallet_to_position(
  p_pallet_id UUID,
  p_posicao_id UUID,
  p_observacoes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position_occupied BOOLEAN;
BEGIN
  -- Check if position is available
  SELECT ocupado INTO v_position_occupied
  FROM storage_positions
  WHERE id = p_posicao_id AND ativo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Posição não encontrada ou inativa';
  END IF;
  
  IF v_position_occupied THEN
    RAISE EXCEPTION 'Posição já está ocupada';
  END IF;
  
  -- Insert pallet position
  INSERT INTO pallet_positions (
    pallet_id,
    posicao_id, 
    alocado_por,
    observacoes
  ) VALUES (
    p_pallet_id,
    p_posicao_id,
    auth.uid(),
    p_observacoes
  );
  
  -- Mark position as occupied
  UPDATE storage_positions
  SET ocupado = true, updated_at = now()
  WHERE id = p_posicao_id;
  
  RETURN TRUE;
END;
$$;

-- Function to create stock from allocated pallets
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
    -- Create or update stock using simple INSERT ON CONFLICT
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
    ON CONFLICT (user_id, produto_id, deposito_id, COALESCE(lote, ''))
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
      'pallet_allocation',
      v_item.lote,
      'Entrada via alocação de pallet - Posição: ' || (SELECT codigo FROM storage_positions WHERE id = v_pallet_position.posicao_id),
      now()
    );
  END LOOP;
  
  RETURN TRUE;
END;
$$;