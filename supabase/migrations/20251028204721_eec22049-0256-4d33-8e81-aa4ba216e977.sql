-- Recriar o trigger que cria movimentações automaticamente para saídas
-- Este trigger estava faltando e causava saídas órfãs sem movimentações

DROP TRIGGER IF EXISTS trigger_process_saida_on_insert ON public.saidas;

CREATE TRIGGER trigger_process_saida_on_insert
  AFTER INSERT ON public.saidas
  FOR EACH ROW
  WHEN (NEW.status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel'))
  EXECUTE FUNCTION trigger_process_saida_item();

-- Processar saídas órfãs retroativamente (saídas sem movimentações)
DO $$
DECLARE
  saida_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  FOR saida_record IN 
    SELECT s.id 
    FROM saidas s
    WHERE NOT EXISTS (
      SELECT 1 FROM movimentacoes m 
      WHERE m.referencia_tipo = 'saida' AND m.referencia_id = s.id
    )
    AND s.status_aprovacao_produtor IN ('aprovado', 'nao_aplicavel')
    ORDER BY s.created_at
  LOOP
    PERFORM process_saida_items(saida_record.id);
    processed_count := processed_count + 1;
  END LOOP;
  
  RAISE LOG 'Processadas % saídas órfãs', processed_count;
END $$;