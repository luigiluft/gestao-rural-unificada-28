-- Recadastrar produtos com códigos específicos
-- Inserir produtos diretamente

DO $$
DECLARE
    v_user_id UUID;
    produto_record RECORD;
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
    
    -- Se ainda não há usuário, sair
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado para associar aos produtos';
        RETURN;
    END IF;
    
    -- Array de produtos para inserir
    FOR produto_record IN (
        SELECT * FROM (VALUES
            ('200101003386', 'WIPE OUT 720 WG- Saco 20KG', 'KG'),
            ('200101001711', 'BLOWOUT 200 SL- Bombona 20L', 'L'),
            ('000129', 'PRILAN DUO 240 SC- Bombona 5L (4x)', 'L'),
            ('0000168', 'ACEFATO FERSOL 750 SP- Saco 5KG (2x)', 'KG'),
            ('HRB00034', 'DECORUM 806 SL- Bombona 20L', 'L'),
            ('200101000287', 'GLUCARE 200 SL- Bombona 20L', 'L'),
            ('200101000040', 'GLIFOSATO IPA 480 SL- Bombona 20L', 'L'),
            ('200101003390', 'HERBZINA PLUS 900 WG- Saco 10KG', 'KG'),
            ('200201000214', 'SAFENITH 720 SC- Bombona 20L', 'L'),
            ('200301000761', 'MASTEROLE 240 SC- Bombona 20L', 'L'),
            ('WD20230520', 'WILURON 500 SC- Bombona 20L', 'L'),
            ('WA20230510', 'WILTRYN 800 WG- Saco 25KG', 'KG'),
            ('INS00004', 'CLOPANTO 480 EC- Bombona 20L', 'L')
        ) AS t(codigo, nome, unidade)
    ) LOOP
        -- Verificar se produto já existe com mesmo nome
        IF EXISTS (SELECT 1 FROM produtos WHERE nome = produto_record.nome AND user_id = v_user_id) THEN
            -- Atualizar produto existente
            UPDATE produtos 
            SET codigo = produto_record.codigo, 
                unidade_medida = produto_record.unidade,
                updated_at = now()
            WHERE nome = produto_record.nome AND user_id = v_user_id;
            
            RAISE NOTICE 'Produto atualizado: %', produto_record.nome;
        ELSE
            -- Inserir novo produto
            INSERT INTO produtos (user_id, codigo, nome, unidade_medida, ativo)
            VALUES (v_user_id, produto_record.codigo, produto_record.nome, produto_record.unidade, true);
            
            RAISE NOTICE 'Produto inserido: %', produto_record.nome;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Recadastramento de produtos concluído!';
END $$;