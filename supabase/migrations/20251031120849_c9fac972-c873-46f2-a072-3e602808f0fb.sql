-- ============================================
-- CORREÇÃO: Remover acesso de Produtores a storage_positions
-- ============================================
-- Motivo: Produtores não devem ter acesso a informações de posições físicas
--         nem por frontend nem por acesso direto à API

-- Remover política que permite SELECT para produtores
DROP POLICY IF EXISTS "Produtores can view positions in assigned deposits" 
ON public.storage_positions;

-- ============================================
-- RESULTADO FINAL: Apenas Admins e Franqueados têm acesso
-- ============================================
-- 1. "Admins full access to all positions" - ALL para admins
-- 2. "Franqueados can view their deposit positions" - SELECT para franqueados
-- 3. "Franqueados can manage their deposit positions" - ALL para franqueados

-- Comentário explicativo
COMMENT ON TABLE public.storage_positions IS 
'Storage positions (physical warehouse locations). Access restricted to Admins (full) and Franqueados (their deposits only). Produtores have NO access by design.';