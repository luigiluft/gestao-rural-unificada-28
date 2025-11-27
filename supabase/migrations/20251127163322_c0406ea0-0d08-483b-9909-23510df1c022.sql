-- ================================================
-- REMOVE DUPLICATE INDEXES
-- ================================================

-- 1. cliente_usuarios: Keep the shorter named indexes
DROP INDEX IF EXISTS public.idx_cliente_usuarios_cliente_id;
DROP INDEX IF EXISTS public.idx_cliente_usuarios_user_id;

-- 2. contrato_janelas_entrega: Keep idx_janelas_contrato
DROP INDEX IF EXISTS public.idx_contrato_janelas_entrega_contrato_id;

-- 3. contrato_servicos_itens: Keep idx_contrato_itens_contrato
DROP INDEX IF EXISTS public.idx_contrato_servicos_itens_contrato_id;

-- 4. contrato_sla: Keep idx_contrato_sla_contrato
DROP INDEX IF EXISTS public.idx_contrato_sla_contrato_id;

-- 5. contratos_servico: Keep the shorter named indexes
DROP INDEX IF EXISTS public.idx_contratos_servico_franquia_id;
DROP INDEX IF EXISTS public.idx_contratos_servico_produtor_id;

-- 6. ctes: UNIQUE index already covers saida_id, drop regular index
DROP INDEX IF EXISTS public.idx_ctes_saida_id;

-- 7. divergencias: Keep the shorter named indexes
DROP INDEX IF EXISTS public.idx_divergencias_produto_id;
DROP INDEX IF EXISTS public.idx_divergencias_user_id;

-- 8. fatura_itens: Keep idx_fatura_itens_fatura
DROP INDEX IF EXISTS public.idx_fatura_itens_fatura_id;

-- 9. faturas: Keep idx_faturas_contrato
DROP INDEX IF EXISTS public.idx_faturas_contrato_id;