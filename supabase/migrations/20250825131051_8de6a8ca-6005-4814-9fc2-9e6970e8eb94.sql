-- Função para resetar posições de uma onda específica e reprocessar
CREATE OR REPLACE FUNCTION public.reset_wave_positions(p_wave_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    wave_item RECORD;
BEGIN
    -- Limpar reservas temporárias antigas desta onda
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
    
    -- Limpar reservas expiradas globalmente
    PERFORM public.clean_expired_reservations();
    
    -- Reprocessar alocação automática
    PERFORM public.auto_allocate_positions(p_wave_id);
    
    -- Atualizar status da onda
    UPDATE public.allocation_waves 
    SET status = 'posicoes_definidas'
    WHERE id = p_wave_id;
    
    RETURN TRUE;
END;
$function$;