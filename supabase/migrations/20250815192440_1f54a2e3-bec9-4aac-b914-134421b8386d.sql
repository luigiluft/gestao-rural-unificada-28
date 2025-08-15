-- Criar índices únicos para prevenir futuras duplicatas de NFe

-- Criar índice único para chave NFe para prevenir futuras duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_entradas_chave_nfe_unique 
ON public.entradas (chave_nfe) 
WHERE chave_nfe IS NOT NULL AND chave_nfe != '';

-- Criar índice único composto para numero + serie + CNPJ do emitente
CREATE UNIQUE INDEX IF NOT EXISTS idx_entradas_nf_unique 
ON public.entradas (numero_nfe, serie, emitente_cnpj) 
WHERE numero_nfe IS NOT NULL 
  AND serie IS NOT NULL 
  AND emitente_cnpj IS NOT NULL
  AND numero_nfe != ''
  AND serie != ''
  AND emitente_cnpj != '';