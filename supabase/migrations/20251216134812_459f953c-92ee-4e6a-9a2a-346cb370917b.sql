-- Fix calcular_prioridade_saida function to use fully qualified table names
CREATE OR REPLACE FUNCTION public.calcular_prioridade_saida(p_saida_id uuid)
 RETURNS TABLE(saida_id uuid, score_final numeric, performance_sla_produtor numeric, proximidade_agendamento numeric, cliente_vip numeric, tempo_fila numeric, percentual_sla_historico numeric, sla_contrato_percentual numeric, diferenca_sla numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_config RECORD;
  v_saida RECORD;
  v_periodo_analise INTEGER;
  v_sla_data RECORD;
  
  -- Scores individuais
  v_score_sla NUMERIC := 0;
  v_score_proximidade NUMERIC := 0;
  v_score_vip NUMERIC := 0;
  v_score_tempo NUMERIC := 0;
  v_score_total NUMERIC := 0;
  v_peso_total NUMERIC := 0;
BEGIN
  -- Buscar configuração de priorização (FULLY QUALIFIED)
  SELECT * INTO v_config
  FROM public.configuracoes_priorizacao_separacao
  WHERE ativo = true
  LIMIT 1;

  -- Se não existe configuração ou modo é FIFO, retorna scores zerados
  IF v_config IS NULL OR v_config.modo_priorizacao = 'fifo' THEN
    RETURN QUERY SELECT 
      p_saida_id,
      0::NUMERIC,
      0::NUMERIC,
      0::NUMERIC,
      0::NUMERIC,
      0::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC;
    RETURN;
  END IF;

  -- Buscar dados da saída
  SELECT 
    s.*,
    p.cpf_cnpj as produtor_cpf,
    c.tipo_cliente,
    cs.prioridade_padrao as sla_entrega_percentual
  INTO v_saida
  FROM public.saidas s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  LEFT JOIN public.cliente_usuarios cu ON cu.user_id = s.user_id AND cu.ativo = true
  LEFT JOIN public.clientes c ON c.id = cu.cliente_id
  LEFT JOIN public.contratos_servico cs ON cs.produtor_id = s.user_id AND cs.status = 'ativo'
  WHERE s.id = p_saida_id;

  -- Buscar período de análise SLA
  SELECT COALESCE(NULLIF(valor, '')::INTEGER, 90) INTO v_periodo_analise
  FROM public.configuracoes_sistema
  WHERE chave = 'periodo_analise_sla_dias'
  LIMIT 1;
  
  IF v_periodo_analise IS NULL THEN
    v_periodo_analise := 90;
  END IF;

  -- FATOR 1: Performance SLA do Produtor (considera diferença com contrato)
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'performance_sla_produtor' AND (f->>'ativo')::boolean = true
  ) THEN
    -- Buscar dados de SLA
    SELECT * INTO v_sla_data
    FROM public.calcular_performance_sla_produtor(v_saida.user_id, v_periodo_analise);
    
    -- Score baseado na diferença entre SLA real e contratado
    IF v_sla_data.diferenca_sla >= 2 THEN
      v_score_sla := 5;
    ELSIF v_sla_data.diferenca_sla >= 0 THEN
      v_score_sla := 20;
    ELSIF v_sla_data.diferenca_sla >= -3 THEN
      v_score_sla := 50;
    ELSIF v_sla_data.diferenca_sla >= -5 THEN
      v_score_sla := 80;
    ELSE
      v_score_sla := 100;
    END IF;

    SELECT (f->>'peso')::NUMERIC INTO v_peso_total
    FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'performance_sla_produtor';
    
    v_score_total := v_score_total + (v_score_sla * COALESCE(v_peso_total, 0) / 100);
  END IF;

  -- FATOR 2: Proximidade do Agendamento
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'proximidade_agendamento' AND (f->>'ativo')::boolean = true
  ) THEN
    DECLARE
      v_dias_ate_entrega INTEGER;
      v_peso_proximidade NUMERIC;
    BEGIN
      v_dias_ate_entrega := EXTRACT(DAY FROM (v_saida.data_fim_janela - CURRENT_DATE));
      
      IF v_dias_ate_entrega IS NULL OR v_dias_ate_entrega <= 0 THEN
        v_score_proximidade := 100;
      ELSIF v_dias_ate_entrega = 1 THEN
        v_score_proximidade := 90;
      ELSIF v_dias_ate_entrega <= 3 THEN
        v_score_proximidade := 70;
      ELSIF v_dias_ate_entrega <= 7 THEN
        v_score_proximidade := 40;
      ELSE
        v_score_proximidade := 10;
      END IF;

      SELECT (f->>'peso')::NUMERIC INTO v_peso_proximidade
      FROM jsonb_array_elements(v_config.fatores) AS f
      WHERE f->>'id' = 'proximidade_agendamento';
      
      v_score_total := v_score_total + (v_score_proximidade * COALESCE(v_peso_proximidade, 0) / 100);
    END;
  END IF;

  -- FATOR 3: Cliente VIP / Urgente
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'cliente_vip' AND (f->>'ativo')::boolean = true
  ) THEN
    DECLARE
      v_peso_vip NUMERIC;
    BEGIN
      IF v_saida.urgente = true THEN
        v_score_vip := 100;
      ELSIF v_saida.tipo_cliente IN ('premium', 'vip') THEN
        v_score_vip := 80;
      ELSE
        v_score_vip := 0;
      END IF;

      SELECT (f->>'peso')::NUMERIC INTO v_peso_vip
      FROM jsonb_array_elements(v_config.fatores) AS f
      WHERE f->>'id' = 'cliente_vip';
      
      v_score_total := v_score_total + (v_score_vip * COALESCE(v_peso_vip, 0) / 100);
    END;
  END IF;

  -- FATOR 4: Tempo na Fila
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'tempo_fila' AND (f->>'ativo')::boolean = true
  ) THEN
    DECLARE
      v_horas_fila INTEGER;
      v_peso_tempo NUMERIC;
    BEGIN
      v_horas_fila := EXTRACT(HOUR FROM (NOW() - v_saida.created_at));
      
      IF v_horas_fila >= 72 THEN
        v_score_tempo := 100;
      ELSIF v_horas_fila >= 48 THEN
        v_score_tempo := 80;
      ELSIF v_horas_fila >= 24 THEN
        v_score_tempo := 60;
      ELSIF v_horas_fila >= 12 THEN
        v_score_tempo := 40;
      ELSE
        v_score_tempo := 20;
      END IF;

      SELECT (f->>'peso')::NUMERIC INTO v_peso_tempo
      FROM jsonb_array_elements(v_config.fatores) AS f
      WHERE f->>'id' = 'tempo_fila';
      
      v_score_total := v_score_total + (v_score_tempo * COALESCE(v_peso_tempo, 0) / 100);
    END;
  END IF;

  -- Retornar resultado
  RETURN QUERY SELECT 
    p_saida_id,
    v_score_total,
    v_score_sla,
    v_score_proximidade,
    v_score_vip,
    v_score_tempo,
    v_sla_data.percentual_sla_historico,
    v_sla_data.sla_contrato_percentual,
    v_sla_data.diferenca_sla;
END;
$function$;