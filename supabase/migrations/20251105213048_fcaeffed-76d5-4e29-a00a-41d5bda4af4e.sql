-- Remover função anterior e recriar com nova lógica
DROP FUNCTION IF EXISTS calcular_performance_sla_produtor(UUID, INTEGER);
DROP FUNCTION IF EXISTS calcular_prioridade_saida(UUID);

-- Função para calcular performance SLA considerando a diferença com o contrato
CREATE OR REPLACE FUNCTION calcular_performance_sla_produtor(
  p_produtor_id UUID,
  p_periodo_dias INTEGER DEFAULT 90
)
RETURNS TABLE (
  percentual_sla_historico NUMERIC,
  sla_contrato_percentual NUMERIC,
  diferenca_sla NUMERIC
) AS $$
DECLARE
  v_total_entregas INTEGER;
  v_entregas_no_prazo INTEGER;
  v_sla_contrato NUMERIC;
BEGIN
  -- Buscar SLA do contrato
  SELECT COALESCE(sla_entrega_percentual, 98) INTO v_sla_contrato
  FROM contratos
  WHERE produtor_id = p_produtor_id
    AND ativo = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não encontrou contrato, usar 98% como padrão
  IF v_sla_contrato IS NULL THEN
    v_sla_contrato := 98;
  END IF;

  -- Contar total de entregas no período
  SELECT COUNT(*) INTO v_total_entregas
  FROM saidas s
  WHERE s.produtor_id = p_produtor_id
    AND s.status IN ('entregue', 'finalizada')
    AND s.data_entrega IS NOT NULL
    AND s.data_entrega >= CURRENT_DATE - p_periodo_dias;

  -- Se não há entregas no período, produtor novo começa com 100%
  IF v_total_entregas = 0 THEN
    RETURN QUERY SELECT 
      100.0::NUMERIC as percentual_sla_historico,
      v_sla_contrato as sla_contrato_percentual,
      (100.0 - v_sla_contrato)::NUMERIC as diferenca_sla;
    RETURN;
  END IF;

  -- Contar entregas no prazo (comparando data_entrega com data_agendamento)
  SELECT COUNT(*) INTO v_entregas_no_prazo
  FROM saidas s
  WHERE s.produtor_id = p_produtor_id
    AND s.status IN ('entregue', 'finalizada')
    AND s.data_entrega IS NOT NULL
    AND s.data_entrega >= CURRENT_DATE - p_periodo_dias
    AND s.data_entrega <= COALESCE(s.data_agendamento, s.data_entrega);

  -- Calcular percentual e diferença
  RETURN QUERY SELECT 
    ROUND((v_entregas_no_prazo::NUMERIC / v_total_entregas::NUMERIC) * 100, 2) as percentual_sla_historico,
    v_sla_contrato as sla_contrato_percentual,
    ROUND((v_entregas_no_prazo::NUMERIC / v_total_entregas::NUMERIC) * 100 - v_sla_contrato, 2) as diferenca_sla;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função principal de cálculo de prioridade (sem fator sla_contrato separado)
CREATE OR REPLACE FUNCTION calcular_prioridade_saida(p_saida_id UUID)
RETURNS TABLE (
  saida_id UUID,
  score_final NUMERIC,
  performance_sla_produtor NUMERIC,
  proximidade_agendamento NUMERIC,
  cliente_vip NUMERIC,
  tempo_fila NUMERIC,
  percentual_sla_historico NUMERIC,
  sla_contrato_percentual NUMERIC,
  diferenca_sla NUMERIC
) AS $$
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
  -- Buscar configuração de priorização
  SELECT * INTO v_config
  FROM configuracoes_priorizacao_separacao
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
    c.sla_entrega_percentual
  INTO v_saida
  FROM saidas s
  LEFT JOIN profiles p ON p.id = s.produtor_id
  LEFT JOIN contratos c ON c.produtor_id = s.produtor_id AND c.ativo = true
  WHERE s.id = p_saida_id;

  -- Buscar período de análise SLA
  SELECT COALESCE(periodo_analise_sla_dias, 90) INTO v_periodo_analise
  FROM configuracoes_sistema
  LIMIT 1;

  -- FATOR 1: Performance SLA do Produtor (considera diferença com contrato)
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'performance_sla_produtor' AND (f->>'ativo')::boolean = true
  ) THEN
    -- Buscar dados de SLA
    SELECT * INTO v_sla_data
    FROM calcular_performance_sla_produtor(v_saida.produtor_id, v_periodo_analise);
    
    -- Score baseado na diferença entre SLA real e contratado
    -- Diferença positiva (indo bem) = score baixo
    -- Diferença negativa (indo mal) = score alto
    IF v_sla_data.diferenca_sla >= 2 THEN
      -- Muito acima do esperado: 5 pontos
      v_score_sla := 5;
    ELSIF v_sla_data.diferenca_sla >= 0 THEN
      -- Dentro ou ligeiramente acima: 20 pontos
      v_score_sla := 20;
    ELSIF v_sla_data.diferenca_sla >= -3 THEN
      -- Levemente abaixo: 50 pontos
      v_score_sla := 50;
    ELSIF v_sla_data.diferenca_sla >= -5 THEN
      -- Bem abaixo: 80 pontos
      v_score_sla := 80;
    ELSE
      -- Muito abaixo (crítico): 100 pontos
      v_score_sla := 100;
    END IF;

    -- Adicionar ao score final com peso configurado
    SELECT (f->>'peso')::NUMERIC INTO v_peso_total
    FROM jsonb_array_elements(v_config.fatores) AS f
    WHERE f->>'id' = 'performance_sla_produtor';
    
    v_score_total := v_score_total + (v_score_sla * v_peso_total / 100);
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
      v_dias_ate_entrega := EXTRACT(DAY FROM (v_saida.data_agendamento - CURRENT_DATE));
      
      IF v_dias_ate_entrega <= 0 THEN
        v_score_proximidade := 100; -- Já passou ou é hoje
      ELSIF v_dias_ate_entrega = 1 THEN
        v_score_proximidade := 90; -- Amanhã
      ELSIF v_dias_ate_entrega <= 3 THEN
        v_score_proximidade := 70; -- 2-3 dias
      ELSIF v_dias_ate_entrega <= 7 THEN
        v_score_proximidade := 40; -- Dentro da semana
      ELSE
        v_score_proximidade := 10; -- Mais de uma semana
      END IF;

      SELECT (f->>'peso')::NUMERIC INTO v_peso_proximidade
      FROM jsonb_array_elements(v_config.fatores) AS f
      WHERE f->>'id' = 'proximidade_agendamento';
      
      v_score_total := v_score_total + (v_score_proximidade * v_peso_proximidade / 100);
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
      
      v_score_total := v_score_total + (v_score_vip * v_peso_vip / 100);
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
        v_score_tempo := 100; -- Mais de 3 dias
      ELSIF v_horas_fila >= 48 THEN
        v_score_tempo := 80; -- 2-3 dias
      ELSIF v_horas_fila >= 24 THEN
        v_score_tempo := 60; -- 1-2 dias
      ELSIF v_horas_fila >= 12 THEN
        v_score_tempo := 40; -- 12-24 horas
      ELSE
        v_score_tempo := 20; -- Menos de 12 horas
      END IF;

      SELECT (f->>'peso')::NUMERIC INTO v_peso_tempo
      FROM jsonb_array_elements(v_config.fatores) AS f
      WHERE f->>'id' = 'tempo_fila';
      
      v_score_total := v_score_total + (v_score_tempo * v_peso_tempo / 100);
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
$$ LANGUAGE plpgsql SECURITY DEFINER;