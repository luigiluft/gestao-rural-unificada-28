-- Remove entradas duplicadas mantendo apenas a primeira entrada de cada NFe

-- Remover entradas duplicadas por chave NFe (mantém a mais antiga)
DELETE FROM public.entradas 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY chave_nfe 
             ORDER BY created_at ASC
           ) as rn
    FROM public.entradas 
    WHERE chave_nfe IS NOT NULL AND chave_nfe != ''
  ) t
  WHERE t.rn > 1
);

-- Remover entradas duplicadas por numero + serie + CNPJ do emitente (mantém a mais antiga)
DELETE FROM public.entradas 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY numero_nfe, serie, emitente_cnpj 
             ORDER BY created_at ASC
           ) as rn
    FROM public.entradas 
    WHERE numero_nfe IS NOT NULL 
      AND serie IS NOT NULL 
      AND emitente_cnpj IS NOT NULL
      AND numero_nfe != ''
      AND serie != ''
      AND emitente_cnpj != ''
  ) t
  WHERE t.rn > 1
);