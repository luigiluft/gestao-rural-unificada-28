-- Adicionar campo codigo_produto na tabela entrada_itens
ALTER TABLE public.entrada_itens 
ADD COLUMN codigo_produto TEXT;

-- Atualizar produtos existentes com os códigos fornecidos
UPDATE public.entrada_itens 
SET codigo_produto = CASE 
    WHEN nome_produto ILIKE '%GLIFOSATO 720 WG%' THEN '200101003386'
    WHEN nome_produto ILIKE '%DIQUATE 200 SL%' THEN '200101001711'
    WHEN nome_produto ILIKE '%AZOXISTROBINA 240 SC%' THEN '000129'
    WHEN nome_produto ILIKE '%ACEFATO 750 SP%' THEN '0000168'
    WHEN nome_produto ILIKE '%2,4-D 806 SL%' THEN 'HRB00034'
    WHEN nome_produto ILIKE '%GLUFOSINATO DE AMÔNIO 200 SL%' THEN '200101000287'
    WHEN nome_produto ILIKE '%GLIFOSATO IPA 480 SL%' THEN '200101000040'
    WHEN nome_produto ILIKE '%ATRAZINA 900 WG%' THEN '200101003390'
    WHEN nome_produto ILIKE '%CLOROTALONIL 720 SC%' THEN '200201000214'
    WHEN nome_produto ILIKE '%METOXIFENOZIDA 240 SC%' THEN '200301000761'
    WHEN nome_produto ILIKE '%DIURON 500 SC%' THEN 'WD20230520'
    WHEN nome_produto ILIKE '%AMETRINA 800 WG%' THEN 'WA20230510'
    WHEN nome_produto ILIKE '%CLORPIRIFÓS 480 EC%' THEN 'INS00004'
    ELSE codigo_produto
END
WHERE nome_produto IS NOT NULL;