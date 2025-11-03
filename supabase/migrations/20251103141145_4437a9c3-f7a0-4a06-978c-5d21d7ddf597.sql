-- Forçar recriação da função calcular_servicos_periodo com DROP primeiro
DROP FUNCTION IF EXISTS public.calcular_servicos_periodo(uuid, timestamp with time zone, timestamp with time zone);

CREATE FUNCTION public.calcular_servicos_periodo(
  p_contrato_id uuid, 
  p_data_inicio timestamp with time zone, 
  p_data_fim timestamp with time zone
)
RETURNS TABLE(
  tipo_servico tipo_servico_contrato, 
  quantidade numeric, 
  valor_unitario numeric, 
  valor_total numeric, 
  descricao text, 
  detalhes_calculo jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_contrato RECORD;
  v_produtor_user_id UUID;
  v_franquia_id UUID;
  v_entrada_preco NUMERIC;
  v_saida_preco NUMERIC;
  v_armazenagem_preco NUMERIC;
  v_qtd_entrada NUMERIC := 0;
  v_qtd_saida NUMERIC := 0;
  v_qtd_armazenagem NUMERIC := 0;
  v_dias_periodo INTEGER;
BEGIN
  -- Buscar informações do contrato
  SELECT cs.*, cs.produtor_id, cs.franquia_id
  INTO v_contrato
  FROM contratos_servico cs
  WHERE cs.id = p_contrato_id AND cs.status = 'ativo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado ou inativo';
  END IF;

  v_produtor_user_id := v_contrato.produtor_id;
  v_franquia_id := v_contrato.franquia_id;

  -- Buscar preços dos serviços no contrato
  SELECT 
    MAX(CASE WHEN csi.tipo_servico = 'entrada_item' THEN csi.valor_unitario END),
    MAX(CASE WHEN csi.tipo_servico = 'saida_item' THEN csi.valor_unitario END),
    MAX(CASE WHEN csi.tipo_servico = 'armazenagem_pallet_dia' THEN csi.valor_unitario END)
  INTO v_entrada_preco, v_saida_preco, v_armazenagem_preco
  FROM contrato_servicos_itens csi
  WHERE csi.contrato_id = p_contrato_id AND csi.ativo = true;

  -- Calcular dias do período
  v_dias_periodo := EXTRACT(DAY FROM (p_data_fim - p_data_inicio)) + 1;

  -- 1. SERVIÇO DE RECEBIMENTO (entrada_item)
  SELECT COALESCE(COUNT(DISTINCT ep.id), 0)
  INTO v_qtd_entrada
  FROM entrada_pallets ep
  INNER JOIN entradas e ON e.id = ep.entrada_id
  WHERE e.user_id = v_produtor_user_id
    AND e.deposito_id = v_franquia_id
    AND e.status_aprovacao = 'confirmado'
    AND e.data_aprovacao >= p_data_inicio
    AND e.data_aprovacao <= p_data_fim;

  IF v_qtd_entrada > 0 AND v_entrada_preco > 0 THEN
    RETURN QUERY SELECT
      'entrada_item'::tipo_servico_contrato,
      v_qtd_entrada,
      v_entrada_preco,
      v_qtd_entrada * v_entrada_preco,
      'Recebimento de pallets'::text,
      jsonb_build_object(
        'periodo', jsonb_build_object('inicio', p_data_inicio, 'fim', p_data_fim),
        'quantidade_pallets', v_qtd_entrada
      );
  END IF;

  -- 2. SERVIÇO DE EXPEDIÇÃO (saida_item) - USANDO data_saida
  SELECT COALESCE(COUNT(*), 0)
  INTO v_qtd_saida
  FROM saida_itens si
  INNER JOIN saidas s ON s.id = si.saida_id
  WHERE s.user_id = v_produtor_user_id
    AND s.deposito_id = v_franquia_id
    AND s.status = 'expedido'
    AND s.data_saida >= p_data_inicio
    AND s.data_saida <= p_data_fim;

  IF v_qtd_saida > 0 AND v_saida_preco > 0 THEN
    RETURN QUERY SELECT
      'saida_item'::tipo_servico_contrato,
      v_qtd_saida,
      v_saida_preco,
      v_qtd_saida * v_saida_preco,
      'Expedição de itens'::text,
      jsonb_build_object(
        'periodo', jsonb_build_object('inicio', p_data_inicio, 'fim', p_data_fim),
        'quantidade_itens', v_qtd_saida
      );
  END IF;

  -- 3. SERVIÇO DE ARMAZENAGEM (armazenagem_pallet_dia)
  SELECT COALESCE(COUNT(*), 0)
  INTO v_qtd_armazenagem
  FROM entrada_pallets ep
  INNER JOIN entradas e ON e.id = ep.entrada_id
  WHERE e.user_id = v_produtor_user_id
    AND e.deposito_id = v_franquia_id
    AND e.status_aprovacao = 'confirmado'
    AND ep.quantidade_atual > 0;

  v_qtd_armazenagem := v_qtd_armazenagem * v_dias_periodo;

  IF v_qtd_armazenagem > 0 AND v_armazenagem_preco > 0 THEN
    RETURN QUERY SELECT
      'armazenagem_pallet_dia'::tipo_servico_contrato,
      v_qtd_armazenagem,
      v_armazenagem_preco,
      v_qtd_armazenagem * v_armazenagem_preco,
      format('Armazenagem de pallets (%s dias)', v_dias_periodo)::text,
      jsonb_build_object(
        'periodo', jsonb_build_object('inicio', p_data_inicio, 'fim', p_data_fim),
        'dias', v_dias_periodo,
        'pallets_em_estoque', (v_qtd_armazenagem / v_dias_periodo)::INTEGER
      );
  END IF;

  RETURN;
END;
$function$;