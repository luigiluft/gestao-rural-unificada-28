-- Atualizar a função define_wave_positions para aceitar ondas em andamento
CREATE OR REPLACE FUNCTION public.define_wave_positions(p_wave_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    wave_item RECORD;
    available_position RECORD;
    position_allocated BOOLEAN;
    reservation_duration INTERVAL := INTERVAL '2 hours';
    total_items INTEGER := 0;
    allocated_items INTEGER := 0;
    insufficient_positions BOOLEAN := FALSE;
    wave_status TEXT;
BEGIN
    -- Verificar se a onda existe e obter seu status
    SELECT status INTO wave_status
    FROM allocation_waves 
    WHERE id = p_wave_id;
    
    IF wave_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Onda não encontrada'
        );
    END IF;
    
    -- Aceitar ondas pendentes ou em andamento (para permitir redefinir posições)
    IF wave_status NOT IN ('pendente', 'em_andamento') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Onda deve estar pendente ou em andamento para definir posições'
        );
    END IF;
    
    -- Limpar reservas expiradas primeiro
    PERFORM public.clean_expired_reservations();
    
    -- Contar total de itens pendentes (sem posição ou ainda não alocados)
    SELECT COUNT(*) INTO total_items
    FROM allocation_wave_items 
    WHERE wave_id = p_wave_id 
    AND (posicao_id IS NULL OR status = 'pendente');
    
    -- Se não há itens para processar
    IF total_items = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Todos os itens já possuem posições definidas',
            'allocated_items', 0,
            'total_items', 0
        );
    END IF;
    
    -- Verificar se há posições suficientes disponíveis
    DECLARE
        available_positions_count INTEGER;
        deposito_id_var UUID;
    BEGIN
        -- Obter deposito_id da onda
        SELECT deposito_id INTO deposito_id_var
        FROM allocation_waves
        WHERE id = p_wave_id;
        
        -- Contar posições disponíveis
        SELECT COUNT(*) INTO available_positions_count
        FROM storage_positions sp
        WHERE sp.deposito_id = deposito_id_var
        AND sp.ativo = true
        AND sp.ocupado = false
        AND (sp.reservado_temporariamente = false OR sp.reservado_temporariamente IS NULL);
        
        IF available_positions_count < total_items THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Posições insuficientes. Necessário: ' || total_items || ', Disponível: ' || available_positions_count
            );
        END IF;
    END;
    
    -- Percorrer todos os itens da onda que ainda não tem posição ou estão pendentes
    FOR wave_item IN 
        SELECT * FROM allocation_wave_items 
        WHERE wave_id = p_wave_id 
        AND (posicao_id IS NULL OR status = 'pendente')
        ORDER BY created_at
    LOOP
        position_allocated := FALSE;
        
        -- Encontrar a primeira posição disponível no depósito
        FOR available_position IN 
            SELECT sp.* 
            FROM storage_positions sp
            JOIN allocation_waves aw ON aw.deposito_id = sp.deposito_id
            WHERE aw.id = p_wave_id
            AND sp.ativo = true
            AND sp.ocupado = false
            AND (sp.reservado_temporariamente = false OR sp.reservado_temporariamente IS NULL)
            ORDER BY sp.codigo
            LIMIT 1
        LOOP
            -- Reservar a posição temporariamente para este item
            UPDATE storage_positions
            SET 
                reservado_temporariamente = true,
                reservado_ate = now() + reservation_duration,
                reservado_por_wave_id = p_wave_id
            WHERE id = available_position.id;
            
            -- Alocar a posição para este item
            UPDATE allocation_wave_items
            SET posicao_id = available_position.id,
                status = 'pendente'  -- Garantir que fica pendente para alocação
            WHERE id = wave_item.id;
            
            position_allocated := TRUE;
            allocated_items := allocated_items + 1;
            RAISE LOG 'Position % temporarily reserved for wave item %', available_position.codigo, wave_item.id;
            EXIT; -- Sair do loop de posições
        END LOOP;
        
        -- Se não encontrou posição disponível
        IF NOT position_allocated THEN
            insufficient_positions := TRUE;
            EXIT; -- Sair do loop principal
        END IF;
    END LOOP;
    
    -- Se não conseguiu alocar todas as posições, reverter
    IF insufficient_positions THEN
        -- Limpar reservas desta onda para os itens processados nesta execução
        UPDATE public.storage_positions
        SET 
            reservado_temporariamente = false,
            reservado_ate = NULL,
            reservado_por_wave_id = NULL
        WHERE reservado_por_wave_id = p_wave_id
        AND reservado_ate > now() - INTERVAL '1 minute'; -- Apenas as reservas muito recentes
        
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
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Posições definidas com sucesso',
        'allocated_items', allocated_items,
        'total_items', total_items
    );
END;
$function$;