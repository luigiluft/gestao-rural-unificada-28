-- Função para calcular a prioridade de uma saída baseada em fatores configuráveis
CREATE OR REPLACE FUNCTION public.calcular_prioridade_saida(p_saida_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_saida RECORD;
  v_config RECORD;
  v_contrato RECORD;
  v_sla RECORD;
  v_fator JSONB;
  v_score_sla NUMERIC := 0;
  v_score_agendamento NUMERIC := 0;
  v_score_vip NUMERIC := 0;
  v_score_tempo_fila NUMERIC := 0;
  v_prioridade_final NUMERIC := 0;
  v_peso_total NUMERIC := 0;
  v_dias_ate_entrega NUMERIC;
  v_horas_na_fila NUMERIC;
  v_horas_restantes_sla NUMERIC;
BEGIN
  -- Buscar dados da saída
  SELECT * INTO v_saida
  FROM public.saidas
  WHERE id = p_saida_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Buscar configuração ativa da franquia (deposito_id)
  SELECT * INTO v_config
  FROM public.configuracoes_priorizacao_separacao
  WHERE franquia_id = v_saida.deposito_id
    AND ativo = true
  LIMIT 1;
  
  -- Se não tem config ou modo é FIFO, não calcular prioridade
  IF NOT FOUND OR v_config.modo_priorizacao = 'fifo' THEN
    UPDATE public.saidas
    SET prioridade_calculada = NULL,
        prioridade_ultima_atualizacao = now(),
        scores_fatores = '{}'::jsonb
    WHERE id = p_saida_id;
    RETURN;
  END IF;
  
  -- Buscar contrato se existir
  IF v_saida.contrato_servico_id IS NOT NULL THEN
    SELECT * INTO v_contrato
    FROM public.contratos_servico
    WHERE id = v_saida.contrato_servico_id;
  END IF;
  
  -- Processar cada fator ativo
  FOR v_fator IN SELECT * FROM jsonb_array_elements(v_config.fatores)
  LOOP
    -- Verificar se fator está ativo
    IF (v_fator->>'ativo')::boolean = false THEN
      CONTINUE;
    END IF;
    
    -- Calcular score baseado no tipo de fator
    CASE v_fator->>'id'
      WHEN 'sla_contrato' THEN
        -- Buscar SLA do contrato
        IF v_contrato.id IS NOT NULL THEN
          SELECT * INTO v_sla
          FROM public.contrato_sla
          WHERE contrato_id = v_contrato.id
            AND tipo_sla = 'prazo_entrega'
            AND ativo = true
          LIMIT 1;
          
          IF FOUND THEN
            -- Calcular horas restantes até o prazo
            v_horas_restantes_sla := EXTRACT(EPOCH FROM (v_saida.data_saida - now())) / 3600;
            
            IF v_horas_restantes_sla <= 0 THEN
              v_score_sla := 100; -- SLA vencido = prioridade máxima
            ELSIF v_horas_restantes_sla <= v_sla.valor_esperado * 0.25 THEN
              v_score_sla := 80; -- 25% do prazo
            ELSIF v_horas_restantes_sla <= v_sla.valor_esperado * 0.5 THEN
              v_score_sla := 60; -- 50% do prazo
            ELSE
              v_score_sla := 40; -- Folga no prazo
            END IF;
          END IF;
        END IF;
        
      WHEN 'proximidade_agendamento' THEN
        -- Calcular dias até a data de saída
        v_dias_ate_entrega := EXTRACT(DAY FROM (v_saida.data_saida::date - CURRENT_DATE));
        
        IF v_dias_ate_entrega <= 0 THEN
          v_score_agendamento := 100; -- Já passou da data
        ELSIF v_dias_ate_entrega = 1 THEN
          v_score_agendamento := 90;
        ELSIF v_dias_ate_entrega = 2 THEN
          v_score_agendamento := 70;
        ELSIF v_dias_ate_entrega <= 3 THEN
          v_score_agendamento := 50;
        ELSIF v_dias_ate_entrega <= 5 THEN
          v_score_agendamento := 30;
        ELSE
          v_score_agendamento := 10;
        END IF;
        
      WHEN 'cliente_vip' THEN
        -- Verificar tags da saída e do contrato
        IF v_saida.tags ? 'urgente' THEN
          v_score_vip := 100;
        ELSIF v_contrato.id IS NOT NULL AND (v_contrato.tags ? 'vip' OR v_contrato.tags ? 'premium') THEN
          v_score_vip := 80;
        ELSIF v_contrato.id IS NOT NULL AND v_contrato.tags ? 'preferencial' THEN
          v_score_vip := 60;
        ELSE
          v_score_vip := 20;
        END IF;
        
      WHEN 'tempo_fila' THEN
        -- Calcular horas na fila
        v_horas_na_fila := EXTRACT(EPOCH FROM (now() - v_saida.created_at)) / 3600;
        
        -- Max horas configurado (padrão 72)
        DECLARE
          v_max_horas NUMERIC := COALESCE((v_fator->'configuracao'->>'max_horas')::numeric, 72);
        BEGIN
          IF v_horas_na_fila >= v_max_horas THEN
            v_score_tempo_fila := 100;
          ELSE
            v_score_tempo_fila := LEAST(100, (v_horas_na_fila / v_max_horas) * 100);
          END IF;
        END;
    END CASE;
  END LOOP;
  
  -- Calcular prioridade final ponderada
  FOR v_fator IN SELECT * FROM jsonb_array_elements(v_config.fatores)
  LOOP
    IF (v_fator->>'ativo')::boolean = false THEN
      CONTINUE;
    END IF;
    
    DECLARE
      v_peso NUMERIC := (v_fator->>'peso')::numeric;
      v_score NUMERIC := 0;
    BEGIN
      CASE v_fator->>'id'
        WHEN 'sla_contrato' THEN v_score := v_score_sla;
        WHEN 'proximidade_agendamento' THEN v_score := v_score_agendamento;
        WHEN 'cliente_vip' THEN v_score := v_score_vip;
        WHEN 'tempo_fila' THEN v_score := v_score_tempo_fila;
      END CASE;
      
      v_prioridade_final := v_prioridade_final + (v_score * v_peso);
      v_peso_total := v_peso_total + v_peso;
    END;
  END LOOP;
  
  -- Normalizar prioridade (0-100)
  IF v_peso_total > 0 THEN
    v_prioridade_final := v_prioridade_final / v_peso_total;
  ELSE
    v_prioridade_final := 0;
  END IF;
  
  -- Atualizar saída com prioridade calculada
  UPDATE public.saidas
  SET prioridade_calculada = v_prioridade_final,
      prioridade_ultima_atualizacao = now(),
      scores_fatores = jsonb_build_object(
        'sla', v_score_sla,
        'agendamento', v_score_agendamento,
        'vip', v_score_vip,
        'tempo_fila', v_score_tempo_fila
      )
  WHERE id = p_saida_id;
END;
$$;

-- Trigger: Calcular prioridade ao inserir nova saída em status separacao_pendente
CREATE OR REPLACE FUNCTION public.trigger_calcular_prioridade_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'separacao_pendente' THEN
    PERFORM public.calcular_prioridade_saida(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saida_calcular_prioridade_after_insert ON public.saidas;
CREATE TRIGGER saida_calcular_prioridade_after_insert
AFTER INSERT ON public.saidas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calcular_prioridade_insert();

-- Trigger: Recalcular prioridade ao atualizar status, contrato ou tags
CREATE OR REPLACE FUNCTION public.trigger_calcular_prioridade_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'separacao_pendente' AND (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.contrato_servico_id IS DISTINCT FROM NEW.contrato_servico_id OR
    OLD.tags IS DISTINCT FROM NEW.tags
  ) THEN
    PERFORM public.calcular_prioridade_saida(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saida_calcular_prioridade_after_update ON public.saidas;
CREATE TRIGGER saida_calcular_prioridade_after_update
AFTER UPDATE ON public.saidas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calcular_prioridade_update();

-- Trigger: Recalcular prioridades ao alocar saída em viagem
CREATE OR REPLACE FUNCTION public.trigger_recalcular_apos_planejamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_saida_id UUID;
BEGIN
  -- Se a saída foi alocada em uma viagem, recalcular outras pendentes do mesmo depósito
  IF OLD.viagem_id IS NULL AND NEW.viagem_id IS NOT NULL THEN
    FOR v_saida_id IN
      SELECT id FROM public.saidas
      WHERE deposito_id = NEW.deposito_id
        AND status = 'separacao_pendente'
        AND id != NEW.id
    LOOP
      PERFORM public.calcular_prioridade_saida(v_saida_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saida_recalcular_apos_planejamento ON public.saidas;
CREATE TRIGGER saida_recalcular_apos_planejamento
AFTER UPDATE OF viagem_id ON public.saidas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalcular_apos_planejamento();

-- Trigger: Recalcular todas as saídas da franquia ao mudar configuração
CREATE OR REPLACE FUNCTION public.trigger_recalcular_apos_config_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_saida_id UUID;
BEGIN
  -- Se modo ou fatores mudaram, recalcular todas as saídas pendentes da franquia
  IF OLD.modo_priorizacao IS DISTINCT FROM NEW.modo_priorizacao OR
     OLD.fatores IS DISTINCT FROM NEW.fatores THEN
    FOR v_saida_id IN
      SELECT id FROM public.saidas
      WHERE deposito_id = NEW.franquia_id
        AND status = 'separacao_pendente'
    LOOP
      PERFORM public.calcular_prioridade_saida(v_saida_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS config_prioriz_recalcular_apos_update ON public.configuracoes_priorizacao_separacao;
CREATE TRIGGER config_prioriz_recalcular_apos_update
AFTER UPDATE ON public.configuracoes_priorizacao_separacao
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalcular_apos_config_update();