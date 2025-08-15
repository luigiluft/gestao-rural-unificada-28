-- Atualizar a função process_entrada_item para usar o nome_produto correto
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
    v_produto_nome TEXT;
BEGIN
    -- Determinar o nome do produto
    v_produto_nome := COALESCE(NEW.nome_produto, NEW.lote, 'Produto ' || substring(NEW.id::text, 1, 8));

    -- If produto_id is null, try to find or create the product
    IF NEW.produto_id IS NULL THEN
        INSERT INTO public.produtos (
            user_id,
            nome,
            unidade_medida,
            codigo,
            ativo
        ) VALUES (
            NEW.user_id,
            v_produto_nome, -- Usar o nome correto do produto
            'UN',
            NEW.lote,
            true
        ) RETURNING id INTO v_produto_id;
        
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = NEW.id;
        
        NEW.produto_id = v_produto_id;
    ELSE
        v_produto_id = NEW.produto_id;
    END IF;

    -- Get the deposito_id from the entrada
    SELECT e.deposito_id INTO v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- If no deposito_id in entrada, find the first available franquia for this producer
    IF v_deposito_id IS NULL THEN
        -- Find franqueado through hierarchy and use their first franquia
        SELECT f.id, f.master_franqueado_id INTO v_deposito_id, v_franqueado_id
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        JOIN public.franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
        WHERE uh.child_user_id = NEW.user_id
        LIMIT 1;
        
        -- If still no franquia, create a default one for the producer's franqueado
        IF v_deposito_id IS NULL THEN
            -- Find the franqueado for this producer
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
        
        -- Update the entrada with the deposito_id (franquia_id)
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
        'Entrada de estoque via NFe',
        now()
    );

    RETURN NEW;
END;
$function$;