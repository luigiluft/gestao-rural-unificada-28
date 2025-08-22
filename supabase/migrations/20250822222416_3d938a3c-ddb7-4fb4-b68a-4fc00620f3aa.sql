-- Criar alocação de teste para testar notificações (versão corrigida)
DO $$
DECLARE
    v_wave_id UUID;
    v_deposito_id UUID;
    v_produto_id UUID;
    v_user_id UUID;
    v_entrada_id UUID;
    v_entrada_item_id UUID;
BEGIN
    -- Gerar IDs
    v_wave_id := gen_random_uuid();
    v_entrada_id := gen_random_uuid();
    v_entrada_item_id := gen_random_uuid();
    
    -- Buscar um depósito existente
    SELECT id INTO v_deposito_id FROM public.franquias WHERE ativo = true LIMIT 1;
    
    -- Buscar um produto existente
    SELECT id INTO v_produto_id FROM public.produtos WHERE ativo = true LIMIT 1;
    
    -- Buscar um usuário existente
    SELECT user_id INTO v_user_id FROM public.profiles LIMIT 1;
    
    -- Se não encontrou depósito, criar um
    IF v_deposito_id IS NULL THEN
        INSERT INTO public.franquias (nome, master_franqueado_id, ativo)
        VALUES ('Depósito Teste', v_user_id, true)
        RETURNING id INTO v_deposito_id;
    END IF;
    
    -- Se não encontrou produto, criar um
    IF v_produto_id IS NULL THEN
        INSERT INTO public.produtos (user_id, nome, unidade_medida, ativo)
        VALUES (v_user_id, 'Produto Teste Alocação', 'UN', true)
        RETURNING id INTO v_produto_id;
    END IF;
    
    -- Criar entrada de teste
    INSERT INTO public.entradas (
        id,
        user_id,
        deposito_id,
        data_entrada,
        status_aprovacao,
        numero_nfe,
        chave_nfe
    ) VALUES (
        v_entrada_id,
        v_user_id,
        v_deposito_id,
        CURRENT_DATE,
        'confirmado',
        'TEST-001',
        'TEST-CHAVE-001'
    );
    
    -- Criar item da entrada
    INSERT INTO public.entrada_itens (
        id,
        entrada_id,
        user_id,
        produto_id,
        nome_produto,
        quantidade,
        valor_unitario,
        lote
    ) VALUES (
        v_entrada_item_id,
        v_entrada_id,
        v_user_id,
        v_produto_id,
        'Produto Teste Alocação',
        100,
        10.50,
        'LOTE-TEST-001'
    );
    
    -- Criar onda de alocação concluída
    INSERT INTO public.allocation_waves (
        id,
        numero_onda,
        deposito_id,
        status,
        created_by,
        data_criacao,
        data_conclusao
    ) VALUES (
        v_wave_id,
        'WAVE-TEST-' || TO_CHAR(now(), 'YYYYMMDD-HH24MISS'),
        v_deposito_id,
        'concluido',
        v_user_id,
        now() - interval '1 hour',
        now() - interval '5 minutes'  -- Concluída há 5 minutos
    );
    
    -- Criar item de alocação
    INSERT INTO public.allocation_wave_items (
        wave_id,
        entrada_item_id,
        produto_id,
        quantidade,
        quantidade_alocada,
        status,
        data_alocacao,
        alocado_por,
        lote,
        barcode_produto
    ) VALUES (
        v_wave_id,
        v_entrada_item_id,
        v_produto_id,
        100,
        100,
        'alocado',
        now() - interval '5 minutes',
        v_user_id,
        'LOTE-TEST-001',
        'TEST-BARCODE-001'
    );
    
    RAISE NOTICE 'Alocação de teste criada com sucesso! Wave ID: %', v_wave_id;
END $$;