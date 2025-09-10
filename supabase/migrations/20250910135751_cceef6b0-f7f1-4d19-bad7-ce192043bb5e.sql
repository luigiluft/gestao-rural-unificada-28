-- Função para corrigir inconsistências de posições ocupadas
CREATE OR REPLACE FUNCTION public.fix_position_occupancy_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    position_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- Encontrar posições que deveriam estar ocupadas mas não estão
    FOR position_record IN
        SELECT DISTINCT sp.id, sp.codigo
        FROM storage_positions sp
        JOIN movimentacoes m ON m.deposito_id = sp.deposito_id
        WHERE sp.ocupado = false
        AND sp.ativo = true
        AND m.tipo_movimentacao = 'entrada'
        AND m.quantidade > 0
        AND m.observacoes ILIKE '%Posição: ' || sp.codigo || '%'
        AND EXISTS (
            -- Verificar se realmente há estoque positivo para este produto neste depósito
            SELECT 1 
            FROM movimentacoes m2 
            WHERE m2.produto_id = m.produto_id 
            AND m2.deposito_id = m.deposito_id
            GROUP BY m2.produto_id, m2.deposito_id
            HAVING SUM(m2.quantidade) > 0
        )
    LOOP
        -- Marcar posição como ocupada
        UPDATE storage_positions
        SET ocupado = true, updated_at = now()
        WHERE id = position_record.id;
        
        fixed_count := fixed_count + 1;
        
        RAISE LOG 'Fixed position occupancy: % (ID: %)', position_record.codigo, position_record.id;
    END LOOP;
    
    RAISE LOG 'Fixed % position occupancy inconsistencies', fixed_count;
    RETURN fixed_count;
END;
$function$;

-- Executar a correção
SELECT public.fix_position_occupancy_status();