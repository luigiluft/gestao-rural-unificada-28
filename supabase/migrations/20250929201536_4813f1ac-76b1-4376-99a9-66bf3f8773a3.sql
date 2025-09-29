-- Corrigir a função clean_orphaned_data para remover a chamada à função inexistente
CREATE OR REPLACE FUNCTION public.clean_orphaned_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_movements INTEGER := 0;
    cleaned_pallets INTEGER := 0;
    cleaned_pallet_items INTEGER := 0;
    cleaned_pallet_positions INTEGER := 0;
    result jsonb;
BEGIN
    RAISE LOG 'Starting cleanup of orphaned data';
    
    -- Clean orphaned entrada_pallet_itens (where entrada_pallets don't exist)
    DELETE FROM public.entrada_pallet_itens 
    WHERE pallet_id NOT IN (SELECT id FROM public.entrada_pallets);
    GET DIAGNOSTICS cleaned_pallet_items = ROW_COUNT;
    
    -- Clean orphaned pallet_positions (where entrada_pallets don't exist)
    DELETE FROM public.pallet_positions 
    WHERE pallet_id NOT IN (SELECT id FROM public.entrada_pallets);
    GET DIAGNOSTICS cleaned_pallet_positions = ROW_COUNT;
    
    -- Clean orphaned entrada_pallets (where entradas don't exist)
    DELETE FROM public.entrada_pallets 
    WHERE entrada_id NOT IN (SELECT id FROM public.entradas);
    GET DIAGNOSTICS cleaned_pallets = ROW_COUNT;
    
    -- Clean orphaned movimentacoes (where reference entries don't exist)
    DELETE FROM public.movimentacoes 
    WHERE referencia_tipo = 'entrada' 
    AND referencia_id NOT IN (SELECT id FROM public.entradas);
    GET DIAGNOSTICS cleaned_movements = ROW_COUNT;
    
    result := jsonb_build_object(
        'cleaned_movements', cleaned_movements,
        'cleaned_pallets', cleaned_pallets,
        'cleaned_pallet_items', cleaned_pallet_items,
        'cleaned_pallet_positions', cleaned_pallet_positions,
        'success', true
    );
    
    RAISE LOG 'Cleanup completed: %', result;
    RETURN result;
END;
$$;

-- Executar limpeza de dados órfãos
SELECT clean_orphaned_data();

-- Criar trigger para deletar dados associados quando uma entrada for deletada
CREATE OR REPLACE FUNCTION cascade_delete_entrada() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    -- Deletar movimentações associadas
    DELETE FROM public.movimentacoes 
    WHERE referencia_tipo = 'entrada' AND referencia_id = OLD.id;
    
    -- Deletar movimentações de pallets associados
    DELETE FROM public.movimentacoes 
    WHERE referencia_tipo = 'pallet' AND referencia_id IN (
        SELECT id FROM public.entrada_pallets WHERE entrada_id = OLD.id
    );
    
    -- Deletar entrada_pallet_itens dos pallets desta entrada
    DELETE FROM public.entrada_pallet_itens 
    WHERE pallet_id IN (SELECT id FROM public.entrada_pallets WHERE entrada_id = OLD.id);
    
    -- Deletar pallet_positions dos pallets desta entrada
    DELETE FROM public.pallet_positions 
    WHERE pallet_id IN (SELECT id FROM public.entrada_pallets WHERE entrada_id = OLD.id);
    
    -- Deletar entrada_pallets desta entrada
    DELETE FROM public.entrada_pallets WHERE entrada_id = OLD.id;
    
    -- Deletar entrada_itens desta entrada
    DELETE FROM public.entrada_itens WHERE entrada_id = OLD.id;
    
    -- Deletar histórico de status desta entrada
    DELETE FROM public.entrada_status_historico WHERE entrada_id = OLD.id;
    
    RETURN OLD;
END;
$$;

-- Criar trigger na tabela entradas
DROP TRIGGER IF EXISTS trigger_cascade_delete_entrada ON public.entradas;
CREATE TRIGGER trigger_cascade_delete_entrada
    BEFORE DELETE ON public.entradas
    FOR EACH ROW
    EXECUTE FUNCTION cascade_delete_entrada();