-- Recadastrar produtos com códigos específicos
-- Se o produto já existir (mesmo nome), atualiza o código
-- Se não existir, cria um novo produto

-- Função para obter um user_id válido (admin ou primeiro usuário)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Tentar pegar um admin primeiro
    SELECT user_id INTO v_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Se não há admin, pegar qualquer usuário
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id 
        FROM profiles 
        LIMIT 1;
    END IF;
    
    -- Se ainda não há usuário, criar um produto genérico para admin
    IF v_user_id IS NULL THEN
        -- Para casos onde não há usuários, vamos pular por enquanto
        RAISE NOTICE 'Nenhum usuário encontrado para associar aos produtos';
        RETURN;
    END IF;
    
    -- Inserir ou atualizar produtos
    INSERT INTO produtos (user_id, codigo, nome, unidade_medida, ativo) VALUES
    (v_user_id, '200101003386', 'WIPE OUT 720 WG- Saco 20KG', 'KG', true),
    (v_user_id, '200101001711', 'BLOWOUT 200 SL- Bombona 20L', 'L', true),
    (v_user_id, '000129', 'PRILAN DUO 240 SC- Bombona 5L (4x)', 'L', true),
    (v_user_id, '0000168', 'ACEFATO FERSOL 750 SP- Saco 5KG (2x)', 'KG', true),
    (v_user_id, 'HRB00034', 'DECORUM 806 SL- Bombona 20L', 'L', true),
    (v_user_id, '200101000287', 'GLUCARE 200 SL- Bombona 20L', 'L', true),
    (v_user_id, '200101000040', 'GLIFOSATO IPA 480 SL- Bombona 20L', 'L', true),
    (v_user_id, '200101003390', 'HERBZINA PLUS 900 WG- Saco 10KG', 'KG', true),
    (v_user_id, '200201000214', 'SAFENITH 720 SC- Bombona 20L', 'L', true),
    (v_user_id, '200301000761', 'MASTEROLE 240 SC- Bombona 20L', 'L', true),
    (v_user_id, 'WD20230520', 'WILURON 500 SC- Bombona 20L', 'L', true),
    (v_user_id, 'WA20230510', 'WILTRYN 800 WG- Saco 25KG', 'KG', true),
    (v_user_id, 'INS00004', 'CLOPANTO 480 EC- Bombona 20L', 'L', true)
    ON CONFLICT (user_id, nome) 
    DO UPDATE SET 
        codigo = EXCLUDED.codigo,
        unidade_medida = EXCLUDED.unidade_medida,
        updated_at = now();
    
    -- Também atualizar produtos existentes que tenham nomes similares
    UPDATE produtos SET 
        codigo = '200201000214'
    WHERE LOWER(nome) LIKE '%safenith%' AND user_id = v_user_id;
    
    RAISE NOTICE 'Produtos recadastrados com sucesso!';
END $$;