-- Corrigir dados existentes: atualizar entradas que já têm todos os pallets alocados
UPDATE entradas e
SET status_aprovacao = 'confirmado',
    updated_at = now()
WHERE e.status_aprovacao IN ('aguardando_transporte', 'em_transferencia', 'aguardando_conferencia', 'planejamento')
  AND NOT EXISTS (
    -- Verificar se há pallets sem posição alocada
    SELECT 1 FROM entrada_pallets ep
    LEFT JOIN pallet_positions pp ON pp.pallet_id = ep.id AND pp.status = 'alocado'
    WHERE ep.entrada_id = e.id
      AND pp.id IS NULL
  )
  AND EXISTS (
    -- Garantir que a entrada tem pelo menos um pallet
    SELECT 1 FROM entrada_pallets ep WHERE ep.entrada_id = e.id
  );

-- Criar ou substituir função para atualizar status da entrada após alocação
CREATE OR REPLACE FUNCTION update_entrada_status_on_allocation()
RETURNS TRIGGER AS $$
DECLARE
  v_entrada_id uuid;
  v_pending_count integer;
BEGIN
  -- Obter entrada_id do pallet alocado
  SELECT ep.entrada_id INTO v_entrada_id
  FROM entrada_pallets ep
  WHERE ep.id = NEW.pallet_id;
  
  IF v_entrada_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar pallets pendentes (sem posição alocada)
  SELECT COUNT(*) INTO v_pending_count
  FROM entrada_pallets ep
  LEFT JOIN pallet_positions pp ON pp.pallet_id = ep.id AND pp.status = 'alocado'
  WHERE ep.entrada_id = v_entrada_id
    AND pp.id IS NULL;
  
  -- Se não há pallets pendentes, marcar entrada como confirmada
  IF v_pending_count = 0 THEN
    UPDATE entradas 
    SET status_aprovacao = 'confirmado',
        updated_at = now()
    WHERE id = v_entrada_id
      AND status_aprovacao NOT IN ('confirmado', 'cancelado');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar status quando pallet é alocado
DROP TRIGGER IF EXISTS trigger_update_entrada_on_pallet_allocation ON pallet_positions;
CREATE TRIGGER trigger_update_entrada_on_pallet_allocation
  AFTER INSERT OR UPDATE OF status ON pallet_positions
  FOR EACH ROW
  WHEN (NEW.status = 'alocado')
  EXECUTE FUNCTION update_entrada_status_on_allocation();