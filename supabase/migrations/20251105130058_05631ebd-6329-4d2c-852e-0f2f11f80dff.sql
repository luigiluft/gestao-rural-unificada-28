
-- Corrigir posições marcadas como ocupadas mas sem pallets alocados
UPDATE storage_positions
SET ocupado = false, updated_at = NOW()
WHERE id IN (
  SELECT sp.id
  FROM storage_positions sp
  LEFT JOIN pallet_positions pp ON pp.posicao_id = sp.id AND pp.status = 'alocado'
  WHERE sp.ocupado = true AND pp.id IS NULL
);

-- Criar trigger para manter sincronizado automaticamente
CREATE OR REPLACE FUNCTION sync_storage_position_ocupado()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um pallet é alocado, marcar posição como ocupada
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'alocado' THEN
    UPDATE storage_positions
    SET ocupado = true, updated_at = NOW()
    WHERE id = NEW.posicao_id;
  END IF;

  -- Quando um pallet é removido ou status muda, verificar se deve desocupar
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'alocado' AND NEW.status != 'alocado')) THEN
    -- Verificar se ainda há outros pallets alocados nesta posição
    IF NOT EXISTS (
      SELECT 1 FROM pallet_positions 
      WHERE posicao_id = COALESCE(NEW.posicao_id, OLD.posicao_id) 
      AND status = 'alocado'
      AND id != COALESCE(NEW.id, OLD.id)
    ) THEN
      UPDATE storage_positions
      SET ocupado = false, updated_at = NOW()
      WHERE id = COALESCE(NEW.posicao_id, OLD.posicao_id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_sync_storage_position_ocupado ON pallet_positions;

-- Criar trigger
CREATE TRIGGER trigger_sync_storage_position_ocupado
AFTER INSERT OR UPDATE OR DELETE ON pallet_positions
FOR EACH ROW
EXECUTE FUNCTION sync_storage_position_ocupado();
