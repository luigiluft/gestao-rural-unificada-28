-- Modificar função clean_expired_reservations para focar apenas em limpeza de status
CREATE OR REPLACE FUNCTION public.clean_expired_reservations()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    cleaned_count INTEGER := 0;
    orphan_count INTEGER := 0;
BEGIN
    -- Delegar para a nova função de limpeza baseada em status
    SELECT public.clean_completed_wave_reservations() INTO cleaned_count;
    
    -- Limpar também posições órfãs (sem onda associada válida)
    UPDATE public.storage_positions
    SET 
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL
    WHERE reservado_temporariamente = true 
      AND (
          reservado_por_wave_id IS NULL 
          OR NOT EXISTS (
              SELECT 1 FROM allocation_waves aw 
              WHERE aw.id = storage_positions.reservado_por_wave_id
          )
      );
    
    GET DIAGNOSTICS orphan_count = ROW_COUNT;
    cleaned_count := cleaned_count + orphan_count;
    
    RAISE LOG 'Total cleaned reservations: %', cleaned_count;
    RETURN cleaned_count;
END;
$function$;

-- Modificar função reset_wave_positions para remover dependência de tempo
CREATE OR REPLACE FUNCTION public.reset_wave_positions(p_wave_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    wave_item RECORD;
BEGIN
    -- Limpar reservas desta onda
    UPDATE public.storage_positions
    SET 
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL
    WHERE reservado_por_wave_id = p_wave_id;
    
    -- Limpar posições ocupadas pelos itens desta onda (se ainda não foram fisicamente alocadas)
    FOR wave_item IN 
        SELECT awi.posicao_id
        FROM allocation_wave_items awi
        WHERE awi.wave_id = p_wave_id 
        AND awi.status = 'pendente'
        AND awi.posicao_id IS NOT NULL
    LOOP
        -- Verificar se não há estoque real nesta posição
        IF NOT EXISTS (
            SELECT 1 FROM estoque e
            JOIN storage_positions sp ON sp.deposito_id = e.deposito_id
            WHERE sp.id = wave_item.posicao_id
            AND e.quantidade_atual > 0
        ) THEN
            -- Liberar a posição
            UPDATE public.storage_positions
            SET ocupado = false
            WHERE id = wave_item.posicao_id;
        END IF;
    END LOOP;
    
    -- Resetar os itens da onda para não ter posição definida
    UPDATE public.allocation_wave_items
    SET 
        posicao_id = NULL,
        barcode_produto = NULL,
        barcode_posicao = NULL,
        status = 'pendente'
    WHERE wave_id = p_wave_id 
    AND status = 'pendente';
    
    -- Limpar reservas de ondas concluídas globalmente
    PERFORM public.clean_completed_wave_reservations();
    
    -- Reprocessar alocação automática
    PERFORM public.define_wave_positions(p_wave_id);
    
    RETURN TRUE;
END;
$function$;

-- Adicionar trigger para limpar reservas quando onda for concluída
CREATE OR REPLACE FUNCTION public.cleanup_wave_reservations_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Se a onda foi marcada como concluída, liberar todas as reservas
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluido' THEN
        UPDATE public.storage_positions
        SET 
            reservado_temporariamente = false,
            reservado_ate = NULL,
            reservado_por_wave_id = NULL
        WHERE reservado_por_wave_id = NEW.id;
        
        RAISE LOG 'Released all reservations for completed wave %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar trigger para executar limpeza automática
DROP TRIGGER IF EXISTS trigger_cleanup_wave_reservations ON allocation_waves;
CREATE TRIGGER trigger_cleanup_wave_reservations
    AFTER UPDATE ON allocation_waves
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_wave_reservations_on_completion();