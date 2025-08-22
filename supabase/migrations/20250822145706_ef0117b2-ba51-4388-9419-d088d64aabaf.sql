-- Função para encontrar ou criar produto baseado em entrada_item
CREATE OR REPLACE FUNCTION public.find_or_create_produto(
  p_user_id UUID,
  p_nome_produto TEXT,
  p_codigo_ean TEXT DEFAULT NULL,
  p_codigo_produto TEXT DEFAULT NULL,
  p_unidade_comercial TEXT DEFAULT 'UN',
  p_descricao_produto TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_produto_id UUID;
  v_produto_nome TEXT;
  v_produto_codigo TEXT;
BEGIN
  -- Sanitizar o nome do produto
  v_produto_nome := COALESCE(TRIM(p_nome_produto), TRIM(p_descricao_produto), 'Produto Sem Nome');
  
  -- Determinar o código do produto (priorizar EAN, depois código_produto)
  v_produto_codigo := COALESCE(NULLIF(TRIM(p_codigo_ean), ''), NULLIF(TRIM(p_codigo_produto), ''));
  
  -- Primeiro, tentar encontrar produto existente por código (se houver)
  IF v_produto_codigo IS NOT NULL THEN
    SELECT id INTO v_produto_id
    FROM public.produtos
    WHERE user_id = p_user_id 
      AND UPPER(TRIM(COALESCE(codigo, ''))) = UPPER(TRIM(v_produto_codigo))
      AND ativo = true
    LIMIT 1;
  END IF;
  
  -- Se não encontrou por código, tentar por nome
  IF v_produto_id IS NULL THEN
    SELECT id INTO v_produto_id
    FROM public.produtos
    WHERE user_id = p_user_id 
      AND UPPER(TRIM(nome)) = UPPER(TRIM(v_produto_nome))
      AND ativo = true
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, criar novo produto
  IF v_produto_id IS NULL THEN
    INSERT INTO public.produtos (
      user_id,
      nome,
      codigo,
      unidade_medida,
      descricao,
      ativo
    ) VALUES (
      p_user_id,
      v_produto_nome,
      v_produto_codigo,
      COALESCE(NULLIF(TRIM(p_unidade_comercial), ''), 'UN'),
      COALESCE(NULLIF(TRIM(p_descricao_produto), ''), v_produto_nome),
      true
    ) RETURNING id INTO v_produto_id;
    
    RAISE LOG 'Produto criado automaticamente: % (ID: %)', v_produto_nome, v_produto_id;
  ELSE
    RAISE LOG 'Produto encontrado: % (ID: %)', v_produto_nome, v_produto_id;
  END IF;
  
  RETURN v_produto_id;
END;
$$;

-- Função para processar entrada_itens sem produto_id
CREATE OR REPLACE FUNCTION public.process_entrada_itens_without_produto()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
  v_produto_id UUID;
  processed_count INTEGER := 0;
BEGIN
  -- Processar todos os entrada_itens que não têm produto_id
  FOR item IN 
    SELECT 
      id,
      user_id,
      nome_produto,
      descricao_produto,
      codigo_ean,
      codigo_produto,
      unidade_comercial
    FROM public.entrada_itens 
    WHERE produto_id IS NULL
  LOOP
    -- Encontrar ou criar produto
    v_produto_id := public.find_or_create_produto(
      item.user_id,
      item.nome_produto,
      item.codigo_ean,
      item.codigo_produto,
      item.unidade_comercial,
      item.descricao_produto
    );
    
    -- Atualizar entrada_item com o produto_id
    UPDATE public.entrada_itens
    SET produto_id = v_produto_id
    WHERE id = item.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RAISE LOG 'Processados % entrada_itens', processed_count;
  RETURN processed_count;
END;
$$;

-- Melhorar a função process_entrada_item existente para usar a nova lógica
CREATE OR REPLACE FUNCTION public.process_entrada_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    existing_estoque_id UUID;
    v_franqueado_id UUID;
    v_entrada_status entrada_status;
BEGIN
    -- Verificar o status da entrada antes de processar
    SELECT e.status_aprovacao, e.deposito_id INTO v_entrada_status, v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- Só processar se a entrada está confirmada
    IF v_entrada_status != 'confirmado' THEN
        RETURN NEW;
    END IF;

    -- Se produto_id é null, encontrar ou criar produto
    IF NEW.produto_id IS NULL THEN
        v_produto_id := public.find_or_create_produto(
            NEW.user_id,
            NEW.nome_produto,
            NEW.codigo_ean,
            NEW.codigo_produto,
            NEW.unidade_comercial,
            NEW.descricao_produto
        );
        
        -- Atualizar o entrada_item com o produto_id
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = NEW.id;
        
        NEW.produto_id = v_produto_id;
    ELSE
        v_produto_id = NEW.produto_id;
    END IF;

    -- Se não tem deposito_id, encontrar o primeiro disponível
    IF v_deposito_id IS NULL THEN
        SELECT f.id, f.master_franqueado_id INTO v_deposito_id, v_franqueado_id
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        JOIN public.franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
        WHERE uh.child_user_id = NEW.user_id
        LIMIT 1;
        
        IF v_deposito_id IS NULL THEN
            SELECT uh.parent_user_id INTO v_franqueado_id
            FROM public.user_hierarchy uh
            JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
            WHERE uh.child_user_id = NEW.user_id
            LIMIT 1;
            
            IF v_franqueado_id IS NOT NULL THEN
                INSERT INTO public.franquias (
                    master_franqueado_id,
                    nome,
                    ativo
                ) VALUES (
                    v_franqueado_id,
                    'Franquia Principal',
                    true
                ) RETURNING id INTO v_deposito_id;
            END IF;
        END IF;
        
        IF v_deposito_id IS NOT NULL THEN
            UPDATE public.entradas 
            SET deposito_id = v_deposito_id 
            WHERE id = NEW.entrada_id;
        END IF;
    END IF;

    -- Check if there's already an estoque entry for this product/franquia/lote combination
    SELECT id INTO existing_estoque_id
    FROM public.estoque
    WHERE produto_id = v_produto_id 
      AND deposito_id = v_deposito_id 
      AND COALESCE(lote, '') = COALESCE(NEW.lote, '')
      AND user_id = NEW.user_id;

    IF existing_estoque_id IS NOT NULL THEN
        UPDATE public.estoque
        SET 
            quantidade_atual = quantidade_atual + NEW.quantidade,
            valor_medio = CASE 
                WHEN quantidade_atual > 0 THEN 
                    ((valor_medio * quantidade_atual) + (COALESCE(NEW.valor_unitario, 0) * NEW.quantidade)) / (quantidade_atual + NEW.quantidade)
                ELSE 
                    COALESCE(NEW.valor_unitario, 0)
            END,
            updated_at = now()
        WHERE id = existing_estoque_id;
    ELSE
        INSERT INTO public.estoque (
            user_id,
            produto_id,
            deposito_id,
            quantidade_atual,
            quantidade_reservada,
            valor_medio,
            lote,
            data_validade
        ) VALUES (
            NEW.user_id,
            v_produto_id,
            v_deposito_id,
            NEW.quantidade,
            0,
            COALESCE(NEW.valor_unitario, 0),
            NEW.lote,
            NEW.data_validade
        );
    END IF;

    -- Create movement record
    INSERT INTO public.movimentacoes (
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
        NEW.user_id,
        v_produto_id,
        v_deposito_id,
        'entrada',
        NEW.quantidade,
        NEW.valor_unitario,
        NEW.entrada_id,
        'entrada',
        NEW.lote,
        'Entrada de estoque via NFe - Aprovada pelo franqueado',
        now()
    );

    RETURN NEW;
END;
$$;

-- Executar o processamento dos entrada_itens existentes
SELECT public.process_entrada_itens_without_produto();