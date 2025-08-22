-- Corrigir trigger process_entrada_item para criar produtos imediatamente na importação
CREATE OR REPLACE FUNCTION public.process_entrada_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    existing_estoque_id UUID;
    v_franqueado_id UUID;
    v_entrada_status entrada_status;
BEGIN
    -- SEMPRE criar/encontrar produto, independente do status da entrada
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

    -- Verificar o status da entrada para processar estoque apenas se confirmada
    SELECT e.status_aprovacao, e.deposito_id INTO v_entrada_status, v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- Só processar estoque se a entrada está confirmada
    IF v_entrada_status != 'confirmado' THEN
        RETURN NEW;
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
$function$;

-- Corrigir trigger create_allocation_wave_on_entrada_approved para remover criação duplicada de produtos
CREATE OR REPLACE FUNCTION public.create_allocation_wave_on_entrada_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_wave_id UUID;
    v_wave_number TEXT;
    entrada_item RECORD;
BEGIN
    -- Only process if status changed TO 'confirmado'
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao 
       AND NEW.status_aprovacao = 'confirmado' THEN
        
        -- Generate wave number
        v_wave_number := 'WAVE-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
        
        -- Create allocation wave
        INSERT INTO public.allocation_waves (
            numero_onda,
            deposito_id,
            status,
            created_by
        ) VALUES (
            v_wave_number,
            NEW.deposito_id,
            'pendente',
            COALESCE(auth.uid(), NEW.user_id)
        ) RETURNING id INTO v_wave_id;
        
        -- Create allocation wave items for each entrada item
        -- Produtos já devem estar criados pelo trigger process_entrada_item
        FOR entrada_item IN 
            SELECT * FROM public.entrada_itens ei 
            WHERE ei.entrada_id = NEW.id
        LOOP
            -- Se ainda não tem produto_id (caso raro), usar find_or_create_produto
            IF entrada_item.produto_id IS NULL THEN
                UPDATE public.entrada_itens 
                SET produto_id = public.find_or_create_produto(
                    entrada_item.user_id,
                    entrada_item.nome_produto,
                    entrada_item.codigo_ean,
                    entrada_item.codigo_produto,
                    entrada_item.unidade_comercial,
                    entrada_item.descricao_produto
                )
                WHERE id = entrada_item.id
                RETURNING produto_id INTO entrada_item.produto_id;
            END IF;
            
            INSERT INTO public.allocation_wave_items (
                wave_id,
                entrada_item_id,
                produto_id,
                lote,
                quantidade,
                barcode_produto
            ) VALUES (
                v_wave_id,
                entrada_item.id,
                entrada_item.produto_id,
                entrada_item.lote,
                entrada_item.quantidade,
                entrada_item.lote -- Use lote as initial barcode
            );
        END LOOP;
        
        -- Executar alocação automática de posições
        PERFORM public.auto_allocate_positions(v_wave_id);
        
        -- Atualizar status da onda para 'posicoes_definidas'
        UPDATE public.allocation_waves 
        SET status = 'posicoes_definidas'
        WHERE id = v_wave_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Processar entrada_itens existentes sem produto_id
SELECT public.process_entrada_itens_without_produto();