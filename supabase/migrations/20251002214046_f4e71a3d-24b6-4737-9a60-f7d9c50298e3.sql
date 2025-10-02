-- Primeiro, remover as referências de viagem_id das saídas existentes
UPDATE saidas SET viagem_id = NULL WHERE viagem_id IS NOT NULL;

-- Agora podemos deletar todas as viagens
DELETE FROM viagens;

-- Modificar a foreign key para cascade delete
ALTER TABLE saidas 
DROP CONSTRAINT IF EXISTS saidas_viagem_id_fkey;

ALTER TABLE saidas
ADD CONSTRAINT saidas_viagem_id_fkey 
FOREIGN KEY (viagem_id) 
REFERENCES viagens(id) 
ON DELETE SET NULL;

-- Adicionar trigger para deletar viagens quando todas suas saídas forem removidas
CREATE OR REPLACE FUNCTION delete_viagem_if_no_saidas()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a saída tinha uma viagem, verificar se ainda existem outras saídas nessa viagem
  IF OLD.viagem_id IS NOT NULL THEN
    -- Se não existem mais saídas nesta viagem, deletá-la
    IF NOT EXISTS (
      SELECT 1 FROM saidas 
      WHERE viagem_id = OLD.viagem_id 
      AND id != OLD.id
    ) THEN
      DELETE FROM viagens WHERE id = OLD.viagem_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela saidas
DROP TRIGGER IF EXISTS trigger_delete_viagem_if_no_saidas ON saidas;
CREATE TRIGGER trigger_delete_viagem_if_no_saidas
  AFTER DELETE ON saidas
  FOR EACH ROW
  EXECUTE FUNCTION delete_viagem_if_no_saidas();

COMMENT ON FUNCTION delete_viagem_if_no_saidas() IS 'Deleta viagens automaticamente quando todas suas saídas forem removidas';