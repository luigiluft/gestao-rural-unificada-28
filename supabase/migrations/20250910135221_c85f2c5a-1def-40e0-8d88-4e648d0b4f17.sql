-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.produto_tem_posicao_fisica(
  p_produto_id UUID,
  p_deposito_id UUID,
  p_quantidade NUMERIC DEFAULT 0
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  posicao_count INTEGER := 0;
BEGIN
  -- Verificar se existe em pallets alocados
  SELECT COUNT(*) INTO posicao_count
  FROM entrada_pallets ep
  JOIN entradas e ON e.id = ep.entrada_id
  JOIN entrada_pallet_itens epi ON epi.pallet_id = ep.id
  JOIN entrada_itens ei ON ei.id = epi.entrada_item_id
  JOIN pallet_positions pp ON pp.pallet_id = ep.id
  WHERE ei.produto_id = p_produto_id
    AND e.deposito_id = p_deposito_id
    AND pp.status = 'alocado';
    
  IF posicao_count > 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se existe em movimentações de allocation_wave com posições ocupadas
  SELECT COUNT(*) INTO posicao_count
  FROM movimentacoes m
  JOIN storage_positions sp ON sp.deposito_id = m.deposito_id
  WHERE m.produto_id = p_produto_id
    AND m.deposito_id = p_deposito_id
    AND m.referencia_tipo = 'allocation_wave'
    AND m.tipo_movimentacao = 'entrada'
    AND sp.ocupado = true
    AND sp.ativo = true;
    
  RETURN posicao_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.alocar_produtos_orfaos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  produto_orfao RECORD;
  posicao_disponivel RECORD;
  produtos_alocados INTEGER := 0;
BEGIN
  -- Buscar produtos em estoque sem posição física
  FOR produto_orfao IN
    SELECT DISTINCT
      e.produto_id,
      e.deposito_id,
      e.quantidade_atual,
      p.nome as produto_nome
    FROM estoque e
    JOIN produtos p ON p.id = e.produto_id
    WHERE e.quantidade_atual > 0
      AND NOT produto_tem_posicao_fisica(e.produto_id, e.deposito_id, e.quantidade_atual)
  LOOP
    -- Buscar primeira posição disponível no depósito
    SELECT id, codigo INTO posicao_disponivel
    FROM storage_positions
    WHERE deposito_id = produto_orfao.deposito_id
      AND ativo = true
      AND ocupado = false
    ORDER BY codigo
    LIMIT 1;
    
    IF posicao_disponivel.id IS NOT NULL THEN
      -- Marcar posição como ocupada
      UPDATE storage_positions
      SET ocupado = true,
          updated_at = now()
      WHERE id = posicao_disponivel.id;
      
      -- Criar movimentação de alocação automática
      INSERT INTO movimentacoes (
        user_id,
        produto_id,
        deposito_id,
        tipo_movimentacao,
        quantidade,
        valor_unitario,
        referencia_id,
        referencia_tipo,
        lote,
        observacoes,
        data_movimentacao
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Sistema
        produto_orfao.produto_id,
        produto_orfao.deposito_id,
        'alocacao_automatica',
        0, -- Não altera quantidade, só marca posição
        0,
        posicao_disponivel.id,
        'auto_allocation',
        'AUTO-ALLOC',
        'Alocação automática de produto órfão na posição: ' || posicao_disponivel.codigo,
        now()
      );
      
      produtos_alocados := produtos_alocados + 1;
      
      RAISE LOG 'Produto % alocado automaticamente na posição %', 
        produto_orfao.produto_nome, posicao_disponivel.codigo;
    ELSE
      RAISE LOG 'Não há posições disponíveis para alocar produto %', 
        produto_orfao.produto_nome;
    END IF;
  END LOOP;
  
  RETURN produtos_alocados;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_integridade_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só validar se a quantidade está aumentando
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.quantidade_atual > OLD.quantidade_atual) THEN
    -- Verificar se o produto tem posição física alocada
    IF NOT produto_tem_posicao_fisica(NEW.produto_id, NEW.deposito_id, NEW.quantidade_atual) THEN
      RAISE EXCEPTION 'Não é possível criar/aumentar estoque sem alocação física. Produto deve ter posição definida no depósito.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_movimentacao_entrada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nova_quantidade NUMERIC;
  tem_posicao BOOLEAN;
BEGIN
  -- Só validar movimentações de entrada
  IF NEW.tipo_movimentacao = 'entrada' AND NEW.quantidade > 0 THEN
    -- Calcular nova quantidade total
    SELECT COALESCE(SUM(quantidade), 0) + NEW.quantidade INTO nova_quantidade
    FROM movimentacoes
    WHERE produto_id = NEW.produto_id
      AND deposito_id = NEW.deposito_id;
    
    -- Verificar se já tem posição ou se é uma alocação de pallet/wave
    tem_posicao := produto_tem_posicao_fisica(NEW.produto_id, NEW.deposito_id, nova_quantidade);
    
    -- Permitir se:
    -- 1. Já tem posição física
    -- 2. É movimentação de pallet (que já valida posição)
    -- 3. É movimentação de allocation_wave (que já valida posição)
    IF NOT tem_posicao AND NEW.referencia_tipo NOT IN ('pallet', 'allocation_wave') THEN
      RAISE EXCEPTION 'Movimentação de entrada rejeitada: produto % deve ter posição física alocada antes de confirmar entrada no estoque.', NEW.produto_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;