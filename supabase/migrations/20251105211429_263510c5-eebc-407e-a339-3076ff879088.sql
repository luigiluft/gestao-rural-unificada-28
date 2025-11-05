-- Drop e recriar função calcular_prioridade_saida para incluir performance SLA
DROP FUNCTION IF EXISTS public.calcular_prioridade_saida(uuid);

-- Criar função para calcular performance SLA do produtor
CREATE OR REPLACE FUNCTION public.calcular_performance_sla_produtor(
  p_produtor_id UUID,
  p_periodo_dias INT DEFAULT 90
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_total_entregas INTEGER := 0;
  v_entregas_no_prazo INTEGER := 0;
  v_percentual_cumprimento NUMERIC;
  v_saida RECORD;
  v_data_prevista TIMESTAMP;
  v_data_real TIMESTAMP;
  v_sla_horas NUMERIC;
BEGIN
  -- Buscar saídas concluídas do produtor no período
  FOR v_saida IN
    SELECT 
      s.id,
      s.data_saida,
      s.viagem_id,
      cs.valor_esperado as sla_horas,
      v.data_fim as data_entrega_viagem,
      ce.data_entrega as data_entrega_comprovante
    FROM public.saidas s
    LEFT JOIN public.contratos c ON c.produtor_id = s.produtor_destinatario_id 
      AND c.ativo = true
    LEFT JOIN public.contrato_sla cs ON cs.contrato_id = c.id 
      AND cs.tipo_sla = 'prazo_entrega' 
      AND cs.ativo = true
    LEFT JOIN public.viagens v ON v.id = s.viagem_id
    LEFT JOIN public.comprovantes_entrega ce ON ce.saida_id = s.id
    WHERE s.produtor_destinatario_id = p_produtor_id
      AND s.status IN ('entregue', 'finalizado')
      AND s.data_saida >= (now() - (p_periodo_dias || ' days')::INTERVAL)
    ORDER BY s.data_saida DESC
  LOOP
    v_total_entregas := v_total_entregas + 1;
    
    -- Determinar SLA em horas (padrão 48h se não especificado)
    v_sla_horas := COALESCE(v_saida.sla_horas, 48);
    
    -- Calcular data prevista de entrega
    v_data_prevista := v_saida.data_saida + (v_sla_horas || ' hours')::INTERVAL;
    
    -- Determinar data real de entrega (priorizar comprovante, depois viagem)
    v_data_real := COALESCE(v_saida.data_entrega_comprovante, v_saida.data_entrega_viagem);
    
    -- Se há data real e está dentro do prazo, contar como no prazo
    IF v_data_real IS NOT NULL AND v_data_real <= v_data_prevista THEN
      v_entregas_no_prazo := v_entregas_no_prazo + 1;
    END IF;
  END LOOP;
  
  -- Se não há entregas, retornar 100% (produtor novo = excelente)
  IF v_total_entregas = 0 THEN
    RETURN 100;
  END IF;
  
  -- Calcular percentual de cumprimento (0-100)
  v_percentual_cumprimento := (v_entregas_no_prazo::NUMERIC / v_total_entregas::NUMERIC) * 100;
  
  RETURN ROUND(v_percentual_cumprimento, 2);
END;
$function$;

-- Recriar função calcular_prioridade_saida para incluir performance SLA
CREATE OR REPLACE FUNCTION public.calcular_prioridade_saida(p_saida_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_saida RECORD;
  v_contrato RECORD;
  v_fator RECORD;
  v_config RECORD;
  v_score NUMERIC := 0;
  v_score_total NUMERIC := 0;
  v_peso_total NUMERIC := 0;
  v_scores_fatores jsonb := '{}'::jsonb;
  
  -- Scores individuais
  v_score_tempo_fila NUMERIC := 0;
  v_score_agendamento NUMERIC := 0;
  v_score_sla NUMERIC := 0;
  v_score_vip NUMERIC := 0;
  v_score_performance NUMERIC := 0;
  
  -- Variáveis auxiliares
  v_horas_na_fila NUMERIC;
  v_horas_ate_agendamento NUMERIC;
  v_sla_horas NUMERIC;
  v_is_vip BOOLEAN;
  v_percentual_sla NUMERIC;
  v_periodo_analise_dias INTEGER;
BEGIN
  -- Buscar informações da saída
  SELECT 
    s.*,
    EXTRACT(EPOCH FROM (now() - s.created_at)) / 3600 as horas_criacao,
    EXTRACT(EPOCH FROM (s.data_agendamento - now())) / 3600 as horas_agendamento
  INTO v_saida
  FROM public.saidas s
  WHERE s.id = p_saida_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('score_total', 0, 'scores_fatores', '{}'::jsonb);
  END IF;
  
  -- Buscar contrato do produtor
  SELECT c.*, cs.valor_esperado as sla_horas
  INTO v_contrato
  FROM public.contratos c
  LEFT JOIN public.contrato_sla cs ON cs.contrato_id = c.id 
    AND cs.tipo_sla = 'prazo_entrega' 
    AND cs.ativo = true
  WHERE c.produtor_id = v_saida.produtor_destinatario_id
    AND c.ativo = true
  LIMIT 1;
  
  -- Buscar configuração de priorização ativa
  SELECT * INTO v_config
  FROM public.configuracoes_priorizacao_separacao
  WHERE franquia_id = v_saida.deposito_id
    AND ativo = true
  LIMIT 1;
  
  -- Se não há configuração ou modo é FIFO, retornar score baseado apenas em data
  IF v_config IS NULL OR v_config.modo_priorizacao = 'fifo' THEN
    RETURN jsonb_build_object(
      'score_total', v_saida.horas_criacao,
      'scores_fatores', jsonb_build_object('tempo_fila', v_saida.horas_criacao)
    );
  END IF;
  
  -- Buscar período de análise do SLA (padrão 90 dias)
  SELECT valor::INTEGER INTO v_periodo_analise_dias
  FROM public.configuracoes_sistema
  WHERE chave = 'periodo_analise_sla_dias';
  
  v_periodo_analise_dias := COALESCE(v_periodo_analise_dias, 90);
  
  -- Calcular scores individuais para cada fator ativo
  FOR v_fator IN 
    SELECT * FROM jsonb_to_recordset(v_config.fatores) 
    AS x(id text, nome text, ativo boolean, peso numeric, configuracao jsonb)
    WHERE ativo = true
  LOOP
    v_score := 0;
    
    CASE v_fator.id
      WHEN 'tempo_fila' THEN
        -- Score baseado em horas na fila (0-100)
        v_horas_na_fila := v_saida.horas_criacao;
        IF v_horas_na_fila >= 72 THEN
          v_score := 100;
        ELSIF v_horas_na_fila >= 48 THEN
          v_score := 80;
        ELSIF v_horas_na_fila >= 24 THEN
          v_score := 60;
        ELSIF v_horas_na_fila >= 12 THEN
          v_score := 40;
        ELSE
          v_score := LEAST(100, (v_horas_na_fila / 12) * 40);
        END IF;
        v_score_tempo_fila := v_score;
        
      WHEN 'proximidade_agendamento' THEN
        -- Score baseado em proximidade do agendamento (0-100)
        v_horas_ate_agendamento := v_saida.horas_agendamento;
        IF v_horas_ate_agendamento IS NULL OR v_horas_ate_agendamento < 0 THEN
          v_score := 100; -- Agendamento passou ou não existe
        ELSIF v_horas_ate_agendamento <= 2 THEN
          v_score := 100;
        ELSIF v_horas_ate_agendamento <= 6 THEN
          v_score := 80;
        ELSIF v_horas_ate_agendamento <= 12 THEN
          v_score := 60;
        ELSIF v_horas_ate_agendamento <= 24 THEN
          v_score := 40;
        ELSE
          v_score := GREATEST(0, 40 - ((v_horas_ate_agendamento - 24) / 24) * 10);
        END IF;
        v_score_agendamento := v_score;
        
      WHEN 'sla_contrato' THEN
        -- Score baseado no SLA contratual (quanto mais apertado, maior score)
        v_sla_horas := COALESCE(v_contrato.sla_horas, 48);
        IF v_sla_horas <= 12 THEN
          v_score := 100; -- SLA muito apertado
        ELSIF v_sla_horas <= 24 THEN
          v_score := 80;
        ELSIF v_sla_horas <= 48 THEN
          v_score := 60;
        ELSIF v_sla_horas <= 72 THEN
          v_score := 40;
        ELSE
          v_score := 20;
        END IF;
        v_score_sla := v_score;
        
      WHEN 'cliente_vip' THEN
        -- Score baseado em status VIP do contrato
        v_is_vip := COALESCE(v_contrato.id IS NOT NULL, false);
        v_score := CASE WHEN v_is_vip THEN 100 ELSE 0 END;
        v_score_vip := v_score;
        
      WHEN 'performance_sla_produtor' THEN
        -- Score baseado na performance histórica do produtor
        -- Quanto MENOR o percentual de cumprimento, MAIOR a prioridade
        v_percentual_sla := calcular_performance_sla_produtor(
          v_saida.produtor_destinatario_id, 
          v_periodo_analise_dias
        );
        
        -- Inverter escala: 100% cumprimento = baixa prioridade, 0% = alta prioridade
        IF v_percentual_sla >= 99 THEN
          v_score := 10; -- Muito bom: ≥99% no prazo → baixa prioridade
        ELSIF v_percentual_sla >= 98 THEN
          v_score := 30; -- Bom: 98% no prazo → prioridade baixa-média
        ELSIF v_percentual_sla >= 95 THEN
          v_score := 60; -- Médio: 95-98% no prazo → prioridade média
        ELSIF v_percentual_sla >= 90 THEN
          v_score := 80; -- Ruim: 90-95% no prazo → prioridade alta
        ELSE
          v_score := 100; -- Muito ruim: <90% no prazo → prioridade máxima
        END IF;
        
        -- Ajustar baseado no SLA contratual (SLAs mais apertados ganham boost)
        IF v_contrato.id IS NOT NULL AND v_contrato.sla_horas IS NOT NULL THEN
          IF v_contrato.sla_horas <= 24 THEN
            v_score := LEAST(100, v_score * 1.2); -- +20% para SLA ≤24h
          ELSIF v_contrato.sla_horas <= 48 THEN
            v_score := LEAST(100, v_score * 1.1); -- +10% para SLA ≤48h
          END IF;
        END IF;
        
        v_score_performance := v_score;
    END CASE;
    
    -- Adicionar score ponderado ao total
    v_score_total := v_score_total + (v_score * v_fator.peso / 100);
    v_peso_total := v_peso_total + v_fator.peso;
    
    -- Adicionar ao objeto de scores
    v_scores_fatores := v_scores_fatores || jsonb_build_object(v_fator.id, v_score);
  END LOOP;
  
  -- Normalizar score se os pesos não somam exatamente 100
  IF v_peso_total > 0 AND v_peso_total != 100 THEN
    v_score_total := (v_score_total / v_peso_total) * 100;
  END IF;
  
  -- Adicionar scores individuais ao retorno
  v_scores_fatores := v_scores_fatores || jsonb_build_object(
    'tempo_fila', v_score_tempo_fila,
    'proximidade_agendamento', v_score_agendamento,
    'sla_contrato', v_score_sla,
    'cliente_vip', v_score_vip,
    'performance_sla_produtor', v_score_performance,
    'percentual_sla_historico', v_percentual_sla
  );
  
  RETURN jsonb_build_object(
    'score_total', ROUND(v_score_total, 2),
    'scores_fatores', v_scores_fatores
  );
END;
$function$;