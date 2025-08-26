-- Corrigir estrutura de estoque: remover posicao_id e constraint incorreta
-- Primeiro, remover constraints existentes que podem estar incorretas
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_unique_combination;
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_produto_deposito_posicao_lote_unique;

-- Remover o campo posicao_id da tabela estoque (se existir)
ALTER TABLE public.estoque DROP COLUMN IF EXISTS posicao_id;

-- Adicionar constraint correta (sem posicao_id) 
-- Estoque deve ser consolidado por user_id + produto_id + deposito_id + lote
CREATE UNIQUE INDEX IF NOT EXISTS estoque_unique_combination_idx 
ON public.estoque (user_id, produto_id, deposito_id, COALESCE(lote, ''));

-- Garantir que cada posição só pode ter um pallet ativo por vez
-- Usar índice único condicional para permitir múltiplos pallets concluídos na mesma posição
DROP INDEX IF EXISTS allocation_wave_pallets_posicao_unique_idx;
CREATE UNIQUE INDEX allocation_wave_pallets_posicao_unique_idx 
ON public.allocation_wave_pallets (posicao_id) 
WHERE status IN ('pendente', 'alocado', 'com_divergencia');