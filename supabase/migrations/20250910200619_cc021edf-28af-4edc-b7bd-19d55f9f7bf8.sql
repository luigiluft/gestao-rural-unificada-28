-- Create a function to refresh estoque materialized view with retry logic
CREATE OR REPLACE FUNCTION public.refresh_estoque_with_retry()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_attempts INTEGER := 3;
    current_attempt INTEGER := 0;
    success BOOLEAN := FALSE;
BEGIN
    -- Clean expired reservations first
    PERFORM public.clean_expired_reservations();
    
    WHILE current_attempt < max_attempts AND NOT success LOOP
        current_attempt := current_attempt + 1;
        
        BEGIN
            REFRESH MATERIALIZED VIEW estoque;
            success := TRUE;
            RAISE LOG 'Estoque materialized view refreshed successfully on attempt %', current_attempt;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Failed to refresh estoque on attempt %. Error: %', current_attempt, SQLERRM;
                IF current_attempt < max_attempts THEN
                    -- Wait before retry (exponential backoff)
                    PERFORM pg_sleep(current_attempt * 0.5);
                END IF;
        END;
    END LOOP;
    
    RETURN success;
END;
$$;

-- Create a function to clean orphaned data
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
    
    -- Refresh estoque after cleanup
    PERFORM public.refresh_estoque_with_retry();
    
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