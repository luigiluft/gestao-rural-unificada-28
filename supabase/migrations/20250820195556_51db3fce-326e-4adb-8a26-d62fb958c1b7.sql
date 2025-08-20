-- Adicionar novas colunas à tabela produtos para dados completos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS informacoes_complementares TEXT,
ADD COLUMN IF NOT EXISTS cest TEXT,
ADD COLUMN IF NOT EXISTS ncm TEXT,
ADD COLUMN IF NOT EXISTS mapa_registration TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS composition TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS country_of_manufacturing TEXT,
ADD COLUMN IF NOT EXISTS containers_per_package INTEGER,
ADD COLUMN IF NOT EXISTS package_capacity NUMERIC,
ADD COLUMN IF NOT EXISTS physical_state TEXT,
ADD COLUMN IF NOT EXISTS pests TEXT,
ADD COLUMN IF NOT EXISTS package_capacity_units TEXT,
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS package_string TEXT;

-- Limpar produtos antigos para inserir os novos dados completos
DELETE FROM produtos;

-- Inserir os novos produtos com dados completos
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
    
    -- Se ainda não há usuário, sair
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado para associar aos produtos';
        RETURN;
    END IF;
    
    -- Inserir todos os produtos com dados completos
    INSERT INTO produtos (
        user_id, codigo, nome, unidade_medida, ativo,
        informacoes_complementares, cest, ncm, mapa_registration, manufacturer,
        short_description, category, composition, description, country_of_manufacturing,
        containers_per_package, package_capacity, physical_state, pests,
        package_capacity_units, package_type, package_string
    ) VALUES 
    (v_user_id, '200101003386', 'GLIFOSATO 720 WG', 'KG', true,
     'Nome comercial: WIPE OUT 720 WG- Saco 20KG, classificação do produto: Produto não enquadrado na portaria em vigor sobre transporte de produtos perigosos.',
     '28.063.00', '38089324', '13714', 'Rainbow',
     'WIPE OUT 720 WG- Saco 20KG', 'Herbicidas', 'Glifosato (720 g/kg)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: III - Produto perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Granulado Dispersível (WG), Modo de Ação: Não seletivo, Sistêmico',
     NULL, 1, 20, 'Granulado Dispersível (WG)', NULL, 'KG', 'Saco', 'Saco 20KG'),
     
    (v_user_id, 'HRB00025', 'DIQUATE 200 SL', 'L', true,
     'Nome comercial: DIQUATE 200 SL. BLOWOUT - Classificacao do produto: Numero de risco: 60/Numero da ONU: 3016/Classe ou subclasse de risco: 6.1/ Descricao da classe ou subclasse de risco: Substancias toxicas/Grupo de embalagem: III. Nome apropriado para embarque: PESTICIDA A BASE DE DIPIRIDILIO, LIQUIDO, TOXICO (Dibrometo diquat e Diquatl).',
     '28.063.00', '38089329', '19217', 'Rainbow',
     'BLOWOUT 200 SL- Bombona 20L', 'Herbicidas', 'Diquate 200 ± 12 g/L（Calculado como Ion）',
     'Técnica de Aplicação: Não Classificado, Classe Agronômica: Herbicida, Toxicológica: 3 - Produto Moderadamente Tóxico, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Concentrado Solúvel (SL), Modo de Ação: Contato, Não seletivo',
     NULL, 1, 20, 'Concentrado Solúvel (SL)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, '000129', 'AZOXISTROBINA 240 SC', 'L', true,
     NULL, '28.063.00', '38089299', '22922', 'CropChem',
     'PRILAN DUO 240 SC- Bombona 5L (4x)', 'Fungicidas', 'Azoxistrobina (240 g/L)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Fungicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Suspensão Concentrada (SC), Modo de Ação: Sistêmico',
     NULL, 4, 5, 'Suspensão Concentrada (SC)', NULL, 'L', 'Bombona', 'Bombona 5L (4x)'),
     
    (v_user_id, '0000168', 'ACEFATO 750 SP', 'KG', true,
     'Nome comercial: ACEFATO FERSOL 750 SP- Saco 5KG (2x), Classificacao do produto: Numero de risco: 90. Numero da ONU: 3077. Classe ou subclasse de risco: 9. Descricao da classe ou subclasse de risco: Substancias e artigos perigosos diversos. Grupo de embalagem: III. Nome apropriado para embarque SUBSTÂNCIA QUE APRESENTA RISCO AO MEIO AMBIENTE, SÓLIDA, N.E. (acefato).',
     '28.063.00', '38089191', '458294', 'Zhongshan Chemical',
     'ACEFATO FERSOL 750 SP- Saco 5KG (2x)', 'Inseticidas', 'Acefato (750 g/Kg)',
     'Técnica de Aplicação: Terrestre, Classe Agronômica: Acaricida, Inseticida, Toxicológica: 3 - Produto Moderadamente Tóxico, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Pó solúvel (SP), Modo de Ação: Sistêmico',
     NULL, 2, 5, 'Pó solúvel (SP)', NULL, 'KG', 'Saco', 'Saco 5KG (2x)'),
     
    (v_user_id, 'HRB00034', '2,4-D 806 SL', 'L', true,
     'Nome comercial: 2,4-D 806 SL, DECORUM - 2,4-D DIMETHYLAMINE SALT 806G/L SL 1X20- 8800.00L. Classificacao do produto: Numero de risco: 90. Numero da ONU: 3082. Classe ou subclasse de risco: 9. Descricao da classe ou subclasse de risco: Substancias e artigos perigosos diversos. Grupo de embalagem: III. Nome apropriado para embarque SUBSTANCIA QUE APRESENTA RISCO PARA O MEIO AMBIENTE, LIQUIDA, N.E. (Sal de dimetilamina do acido diclorofenoxiacetico (2,4-D)).',
     '28.063.00', '38089322', '00115', 'Rainbow',
     'DECORUM 806 SL- Bombona 20L', 'Herbicidas', '2,4-D 781.0-831.0 g/L(Calculado como Dimetilamina)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 4 - Produto Pouco Tóxico, Ambiental: III - Produto perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Concentrado Solúvel (SL), Modo de Ação: Seletivo, Sistêmico',
     NULL, 1, 20, 'Concentrado Solúvel (SL)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, '200101000287', 'GLUFOSINATO DE AMÔNIO 200 SL', 'L', true,
     'Nome comercial: GLUFOSINATO DE AMÔNIO 200 SL, Classificação do produto: Produto nao enquadrado na resolucao em vigor sobre transporte de produtos perigosos.',
     '28.063.00', '38089329', '120', 'Rainbow',
     'GLUCARE 200 SL- Bombona 20L', 'Herbicidas', 'Glufosinato 200 ± 12 g/L',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: III - Produto perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Concentrado Solúvel (SL), Modo de Ação: Não seletivo, Sistêmico',
     NULL, 1, 20, 'Concentrado Solúvel (SL)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, '200101000040', 'GLIFOSATO IPA 480 SL', 'L', true,
     NULL, '28.063.00', '38089324', '5417', 'Rainbow',
     'GLIFOSATO IPA 480 SL- Bombona 20L', 'Herbicidas', 'Glifosato (480 g/L por sal de isopropilamina, 360 g/L por ácido) - APG',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: III - Produto perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Concentrado Solúvel (SL), Modo de Ação: Não seletivo, Sistêmico',
     NULL, 1, 20, 'Concentrado Solúvel (SL)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, '200101003390', 'ATRAZINA 900 WG', 'KG', true,
     'Nome comercial: Nome comercial: HERBZINA PLUS - ATRAZINE 90% WG 1X10- 8610.00KG.Classificacao do produto: Numero de risco: 90. Numero da ONU: 3077. Classe ou subclasse de risco: 9. Descricao da classe ou subclasse de risco: Substancias e artigos perigosos diversos. Grupo de embalagem: III. Nome apropriado para embarque: SUBSTANCIA QUE APRESENTA RISCO PARA O MEIO AMBIENTE, SOLIDA, N.E. (Atrazine).',
     '28.063.00', '38089323', '5217', 'Rainbow',
     'HERBZINA PLUS 900 WG- Saco 10KG', 'Herbicidas', 'Atrazina (900 g/kg)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Granulado Dispersível (WG), Modo de Ação: Seletivo, Sistêmico, Ação Residual',
     NULL, 1, 10, 'Granulado Dispersível (WG)', NULL, 'KG', 'Saco', 'Saco 10KG'),
     
    (v_user_id, '200201000214', 'CLOROTALONIL 720 SC', 'L', true,
     'Nome comercial: SAFENITH - CHLOROTHALONIL 720G/L SC 1X20-19200.00L. Classificacao do produto: Numero de risco: 60. Numero da ONU: 2996. Classe ou subclasse de risco: 6.1. Descricao da classe ou subclasse de risco: Substancias e artigos perigosos diversos. Grupo de embalagem: III. Nome apropriado para embarque: PESTICIDA A BASE DE ORGANOCLORADOS,LIQUIDO, TOXICO (Clorotalonil).',
     '28.063.00', '38089299', '23419', 'Rainbow',
     'SAFENITH 720 SC- Bombona 20L', 'Fungicidas', 'Clorotalonil (720 g/L)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Fungicida, Toxicológica: 3 - Produto Moderadamente Tóxico, Ambiental: III - Produto perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Suspensão Concentrada (SC), Modo de Ação: Não sistêmico, Contato',
     NULL, 1, 20, 'Suspensão Concentrada (SC)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, '200301000761', 'METOXIFENOZIDA 240 SC', 'L', true,
     'Nome comercial: Nome comercial: MASTEROLE - METHOXYFENOZIDE 240G/L SC 1X20- 3800.00L.Classificacao do produto: Numero de risco: 90. Numero da ONU: 3082. Classe ou subclasse de risco: 9. Descricao da classe ou subclasse de risco: Substancias e artigos perigosos diversos. Grupo de embalagem: III. Nome apropriado para embarque: SUBSTANCIA QUE APRESENTA RISCO PARA O MEIO AMBIENTE, LIQUIDA, N.E. (Metoxifenozida).',
     '28.063.00', '38089199', '01320', 'Rainbow',
     'MASTEROLE 240 SC- Bombona 20L', 'Inseticidas', 'Metoxifenozida (240 g/L)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Inseticida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: III - Produto perigoso, Corrosividade: Não corrosivo, Formulação: Suspensão Concentrada (SC), Modo de Ação: Não sistêmico, Acelerador de ecdise',
     NULL, 1, 20, 'Suspensão Concentrada (SC)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, 'WD20230520', 'DIURON 500 SC', 'L', true,
     'Nome comercial: WILURON 500 SC- Bombona 20L - Classificação do produto: CLASSIFICAÇÃO TOXICOLÓGICA: CATEGORIA 5 – IMPROVÁVEL DE CAUSAR DANO AGUDO CLASSIFICAÇÃO DO POTENCIAL DE PERICULOSIDADE AMBIENTAL: CLASSE II - PRODUTO MUITO PERIGOSO AO MEIO AMBIENTE. Nome apropriado para embarque DEFENSIVO/ADJUVANTE/ESPALHANTE/ADESIVO/ESTIMULADOR E INIBIDOR DE CRESCIMENTO/INOCULANTE',
     '28.063.00', '38089323', '13519', 'Willowood',
     'WILURON 500 SC- Bombona 20L', 'Herbicidas', 'Diuron (500 g/L)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Suspensão Concentrada (SC)',
     NULL, 1, 20, 'Suspensão Concentrada (SC)', NULL, 'L', 'Bombona', 'Bombona 20L'),
     
    (v_user_id, 'WA20230510', 'AMETRINA 800 WG', 'KG', true,
     NULL, '28.063.00', '38089323', '16208', 'Willowood',
     'WILTRYN 800 WG- Saco 25KG', 'Herbicidas', 'Ametrina (800 g/kg)',
     'Técnica de Aplicação: Terrestre/Aérea, Classe Agronômica: Herbicida, Toxicológica: 5 - Produto Improvável de Causar Dano Agudo, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Corrosivo, Formulação: Granulado Dispersível (WG), Modo de Ação: Seletivo, Sistêmico',
     NULL, 1, 25, 'Granulado Dispersível (WG)', NULL, 'KG', 'Saco', 'Saco 25KG'),
     
    (v_user_id, 'INS00004', 'CLORPIRIFÓS 480 EC', 'L', true,
     'Nome comercial: CLOPANTO 480 EC- Bombona 20L – Classificacao do produto: CLASSIFICAÇÃO TOXICOLÓGICA: CATEGORIA 4 - PRODUTO POUCO TÓXICO CLASSIFICAÇÃO DO POTENCIAL DE PERICULOSIDADE AMBIENTAL: CLASSE II – PRODUTO MUITO PERIGOSO AO MEIO AMBIENTE. Nome apropriado para embarque SUBSTÂNCIA QUE APRESENTA RISCO AO MEIO AMBIENTE, LÍQUIDA, N.E. (clorpirifós).',
     '28.063.00', '29333922', '24320', 'Rainbow',
     'CLOPANTO 480 EC- Bombona 20L', 'Inseticidas', 'Clorpirifós (480 g/L)',
     'Técnica de Aplicação: Terrestre, Classe Agronômica: Inseticida, Toxicológica: 4 - Produto Pouco Tóxico, Ambiental: II - Produto muito perigoso, Inflamabilidade: Não inflamável, Corrosividade: Não corrosivo, Formulação: Concentrado Emulsionável (EC), Modo de Ação: Contato, Ingestão',
     NULL, 1, 20, 'Concentrado Emulsionável (EC)', NULL, 'L', 'Bombona', 'Bombona 20L');
     
    RAISE NOTICE 'Produtos atualizados com dados completos!';
END $$;