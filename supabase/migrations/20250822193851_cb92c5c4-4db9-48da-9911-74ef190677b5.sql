-- Corrigir dados existentes de entrada_itens e produtos com unidades incorretas

-- 1. Atualizar entrada_itens que não têm unidade_comercial definida
-- Tentando extrair a unidade do XML quando disponível
UPDATE public.entrada_itens ei
SET unidade_comercial = CASE 
  -- Se já tem unidade definida, manter
  WHEN ei.unidade_comercial IS NOT NULL AND ei.unidade_comercial != '' THEN ei.unidade_comercial
  -- Tentar extrair do XML da entrada associada
  WHEN EXISTS (
    SELECT 1 FROM public.entradas e 
    WHERE e.id = ei.entrada_id 
    AND e.xml_content IS NOT NULL
    AND e.xml_content LIKE '%<uCom>KG</uCom>%'
    AND ei.nome_produto = (
      -- Extrair o nome do produto do XML para comparar
      SELECT regexp_replace(
        regexp_replace(e.xml_content, '.*<xProd>([^<]+)</xProd>.*', '\1', 'g'),
        '&[^;]+;', '', 'g'
      )
    )
  ) THEN 'KG'
  WHEN EXISTS (
    SELECT 1 FROM public.entradas e 
    WHERE e.id = ei.entrada_id 
    AND e.xml_content IS NOT NULL
    AND e.xml_content LIKE '%<uCom>L</uCom>%'
    AND ei.nome_produto = (
      -- Extrair o nome do produto do XML para comparar
      SELECT regexp_replace(
        regexp_replace(e.xml_content, '.*<xProd>([^<]+)</xProd>.*', '\1', 'g'),
        '&[^;]+;', '', 'g'
      )
    )
  ) THEN 'L'
  -- Para produtos específicos conhecidos, definir unidade baseada no nome
  WHEN ei.nome_produto ILIKE '%bombona%' OR ei.nome_produto ILIKE '%litro%' OR ei.nome_produto ILIKE '%20L%' THEN 'L'
  WHEN ei.nome_produto ILIKE '%saco%' OR ei.nome_produto ILIKE '%kg%' OR ei.nome_produto ILIKE '%5KG%' THEN 'KG'
  -- Caso padrão
  ELSE 'UN'
END
WHERE ei.unidade_comercial IS NULL OR ei.unidade_comercial = '';

-- 2. Atualizar produtos que foram criados com unidade incorreta "UN"
-- baseando-se nas entrada_itens associadas
UPDATE public.produtos p
SET unidade_medida = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.entrada_itens ei 
    WHERE ei.produto_id = p.id 
    AND ei.unidade_comercial IN ('KG', 'L', 'G', 'ML', 'TON')
    LIMIT 1
  ) THEN (
    SELECT ei.unidade_comercial 
    FROM public.entrada_itens ei 
    WHERE ei.produto_id = p.id 
    AND ei.unidade_comercial IS NOT NULL 
    AND ei.unidade_comercial != 'UN'
    LIMIT 1
  )
  -- Para produtos com nomes específicos, corrigir baseado no padrão do nome
  WHEN p.nome ILIKE '%bombona%' OR p.nome ILIKE '%litro%' OR p.nome ILIKE '%20L%' THEN 'L'
  WHEN p.nome ILIKE '%saco%' OR p.nome ILIKE '%kg%' OR p.nome ILIKE '%5KG%' THEN 'KG'
  ELSE p.unidade_medida
END
WHERE p.unidade_medida = 'UN' 
AND (
  EXISTS (
    SELECT 1 FROM public.entrada_itens ei 
    WHERE ei.produto_id = p.id 
    AND ei.unidade_comercial != 'UN'
    AND ei.unidade_comercial IS NOT NULL
  )
  OR p.nome ILIKE '%bombona%' 
  OR p.nome ILIKE '%litro%' 
  OR p.nome ILIKE '%20L%'
  OR p.nome ILIKE '%saco%' 
  OR p.nome ILIKE '%kg%' 
  OR p.nome ILIKE '%5KG%'
);

-- 3. Reprocessar entrada_itens que não têm produto_id usando a função atualizada
SELECT public.process_entrada_itens_without_produto();