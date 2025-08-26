-- Melhorar a função define_wave_positions com logs detalhados e melhor tratamento de erros
CREATE OR REPLACE FUNCTION public.define_wave_positions(p_wave_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    wave_pallet RECORD;
    available_position RECORD;
    position_allocated BOOLEAN;
    total_pallets INTEGER := 0;
    allocated_pallets INTEGER := 0;
    insufficient_positions BOOLEAN := FALSE;
    wave_status TEXT;
    deposito_id_var UUID;
    available_positions_count INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();
    RAISE LOG 'Iniciando define_wave_positions para onda: %', p_wave_id;
    
    -- Verificar se a onda existe e obter seu status
    SELECT status, deposito_id INTO wave_status, deposito_id_var
    FROM allocation_waves 
    WHERE id = p_wave_id;
    
    IF wave_status IS NULL THEN
        RAISE LOG 'Onda não encontrada: %', p_wave_id;
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Onda não encontrada'
        );
    END IF;
    
    RAISE LOG 'Onda encontrada com status: % no depósito: %', wave_status, deposito_id_var;
    
    -- Aceitar ondas pendentes ou em andamento (para permitir redefinir posições)
    IF wave_status NOT IN ('pendente', 'em_andamento') THEN
        RAISE LOG 'Status da onda não permite definição de posições: %', wave_status;
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Onda deve estar pendente ou em andamento para definir posições'
        );
    END IF;
    
    -- Limpar reservas de ondas concluídas primeiro
    PERFORM public.clean_completed_wave_reservations();
    RAISE LOG 'Reservas de ondas concluídas limpas';
    
    -- Contar total de pallets pendentes (sem posição ou ainda não alocados)
    SELECT COUNT(*) INTO total_pallets
    FROM allocation_wave_pallets 
    WHERE wave_id = p_wave_id 
    AND (posicao_id IS NULL OR status = 'pendente');
    
    RAISE LOG 'Total de pallets para processar: %', total_pallets;
    
    -- Se não há pallets para processar
    IF total_pallets = 0 THEN
        RAISE LOG 'Todos os pallets já possuem posições definidas';
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Todos os pallets já possuem posições definidas',
            'allocated_items', 0,
            'total_items', 0
        );
    END IF;
    
    -- Verificar se há posições suficientes disponíveis
    SELECT COUNT(*) INTO available_positions_count
    FROM storage_positions sp
    WHERE sp.deposito_id = deposito_id_var
    AND sp.ativo = true
    AND sp.ocupado = false
    AND (sp.reservado_temporariamente = false OR sp.reservado_temporariamente IS NULL);
    
    RAISE LOG 'Posições disponíveis: %', available_positions_count;
    
    IF available_positions_count < total_pallets THEN
        RAISE LOG 'Posições insuficientes. Necessário: %, Disponível: %', total_pallets, available_positions_count;
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Posições insuficientes. Necessário: ' || total_pallets || ', Disponível: ' || available_positions_count
        );
    END IF;
    
    -- Percorrer todos os pallets da onda que ainda não tem posição ou estão pendentes
    FOR wave_pallet IN 
        SELECT * FROM allocation_wave_pallets 
        WHERE wave_id = p_wave_id 
        AND (posicao_id IS NULL OR status = 'pendente')
        ORDER BY created_at
    LOOP
        position_allocated := FALSE;
        RAISE LOG 'Processando pallet: %', wave_pallet.id;
        
        -- Encontrar a primeira posição disponível no depósito
        FOR available_position IN 
            SELECT sp.* 
            FROM storage_positions sp
            WHERE sp.deposito_id = deposito_id_var
            AND sp.ativo = true
            AND sp.ocupado = false
            AND (sp.reservado_temporariamente = false OR sp.reservado_temporariamente IS NULL)
            ORDER BY sp.codigo
            LIMIT 1
        LOOP
            -- Reservar a posição permanentemente para esta onda (sem prazo)
            UPDATE storage_positions
            SET 
                reservado_temporariamente = true,
                reservado_ate = NULL,  -- Sem prazo de expiração
                reservado_por_wave_id = p_wave_id
            WHERE id = available_position.id;
            
            -- Alocar a posição para este pallet
            UPDATE allocation_wave_pallets
            SET posicao_id = available_position.id,
                status = 'pendente',  -- Garantir que fica pendente para alocação
                updated_at = now()
            WHERE id = wave_pallet.id;
            
            position_allocated := TRUE;
            allocated_pallets := allocated_pallets + 1;
            RAISE LOG 'Posição % reservada para pallet % (sem expiração)', available_position.codigo, wave_pallet.id;
            EXIT; -- Sair do loop de posições
        END LOOP;
        
        -- Se não encontrou posição disponível
        IF NOT position_allocated THEN
            RAISE LOG 'Não foi possível alocar posição para pallet %', wave_pallet.id;
            insufficient_positions := TRUE;
            EXIT; -- Sair do loop principal
        END IF;
    END LOOP;
    
    -- Se não conseguiu alocar todas as posições, reverter
    IF insufficient_positions THEN
        RAISE LOG 'Revertendo reservas por posições insuficientes';
        -- Limpar reservas desta onda para os pallets processados nesta execução
        UPDATE public.storage_positions
        SET 
            reservado_temporariamente = false,
            reservado_ate = NULL,
            reservado_por_wave_id = NULL
        WHERE reservado_por_wave_id = p_wave_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Não foi possível alocar todas as posições necessárias'
        );
    END IF;
    
    -- Atualizar status da onda para 'posicoes_definidas' se estava pendente
    -- Se estava em andamento, manter em andamento
    IF wave_status = 'pendente' THEN
        UPDATE public.allocation_waves 
        SET status = 'posicoes_definidas'
        WHERE id = p_wave_id;
        RAISE LOG 'Status da onda atualizado para posicoes_definidas';
    END IF;
    
    end_time := clock_timestamp();
    RAISE LOG 'define_wave_positions concluída em %ms', EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Posições definidas com sucesso',
        'allocated_items', allocated_pallets,
        'total_items', total_pallets,
        'processing_time_ms', EXTRACT(epoch FROM (end_time - start_time)) * 1000
    );
END;
$function$