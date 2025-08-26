-- Adicionar constraint única na tabela estoque
-- Esta constraint previne duplicatas de estoque para a mesma combinação de:
-- usuário + produto + depósito + lote + posição

ALTER TABLE public.estoque 
ADD CONSTRAINT estoque_unique_combination 
UNIQUE (user_id, produto_id, deposito_id, COALESCE(lote, ''), COALESCE(posicao_id::text, ''));

-- Explicação da constraint:
-- - user_id: mesmo usuário
-- - produto_id: mesmo produto  
-- - deposito_id: mesmo depósito
-- - COALESCE(lote, ''): mesmo lote (trata NULL como string vazia)
-- - COALESCE(posicao_id::text, ''): mesma posição (trata NULL como string vazia)
--
-- Isso garante que não existam registros duplicados de estoque para
-- a mesma combinação de usuário/produto/depósito/lote/posição