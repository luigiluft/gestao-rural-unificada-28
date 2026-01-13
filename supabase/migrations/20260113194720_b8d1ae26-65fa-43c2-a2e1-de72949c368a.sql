-- Criar função RPC para deletar saída de forma segura
CREATE OR REPLACE FUNCTION public.delete_saida_completa(p_saida_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Deletar histórico de status
    DELETE FROM public.saida_status_historico WHERE saida_id = p_saida_id;
    
    -- 2. Deletar movimentações
    DELETE FROM public.movimentacoes WHERE referencia_id = p_saida_id AND referencia_tipo = 'saida';
    
    -- 3. Deletar reservas
    DELETE FROM public.estoque_reservas WHERE saida_id = p_saida_id;
    
    -- 4. Deletar documento_fluxo
    DELETE FROM public.documento_fluxo WHERE saida_id = p_saida_id;
    
    -- 5. Deletar itens
    DELETE FROM public.saida_itens WHERE saida_id = p_saida_id;
    
    -- 6. Deletar a saída
    DELETE FROM public.saidas WHERE id = p_saida_id;
    
    RAISE LOG 'Saída % deletada com sucesso via RPC', p_saida_id;
END;
$$;