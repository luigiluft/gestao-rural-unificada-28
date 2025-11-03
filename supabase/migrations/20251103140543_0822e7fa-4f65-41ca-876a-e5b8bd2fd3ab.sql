-- Criar trigger para atualizar fatura automaticamente quando houver movimentações
-- Versão corrigida sem ALTER DATABASE

CREATE OR REPLACE FUNCTION public.trigger_atualizar_fatura_on_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_produtor_user_id UUID;
  v_deposito_id UUID;
  v_contrato_id UUID;
  v_supabase_url TEXT := 'https://fejvckhuhflndcjuoppy.supabase.co';
  v_supabase_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlanZja2h1aGZsbmRjanVvcHB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1OTAxOCwiZXhwIjoyMDcwMzM1MDE4fQ.i-bGECGcVJ5LvB0g2ORx-J7Pf8Qvq6Ou8yKh-Y5Y1So';
BEGIN
  -- Buscar informações do produtor e depósito
  v_produtor_user_id := NEW.user_id;
  v_deposito_id := NEW.deposito_id;
  
  -- Buscar contrato ativo do produtor para este depósito
  SELECT id INTO v_contrato_id
  FROM contratos_servico
  WHERE produtor_id = v_produtor_user_id
    AND franquia_id = v_deposito_id
    AND status = 'ativo'
  LIMIT 1;
  
  -- Se existe contrato, chamar a edge function para recalcular a fatura
  IF v_contrato_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/gerar-fatura',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_supabase_key
      ),
      body := jsonb_build_object('contrato_id', v_contrato_id)
    );
    
    RAISE LOG 'Fatura recalculada automaticamente para contrato %', v_contrato_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falhar a transação
    RAISE WARNING 'Erro ao atualizar fatura automaticamente: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Aplicar trigger em movimentacoes (INSERT apenas, para entradas e saídas)
DROP TRIGGER IF EXISTS update_fatura_on_movimentacao ON movimentacoes;
CREATE TRIGGER update_fatura_on_movimentacao
AFTER INSERT ON movimentacoes
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_fatura_on_movimentacao();