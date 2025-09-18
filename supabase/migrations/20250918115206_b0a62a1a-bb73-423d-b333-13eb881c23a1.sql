-- Primeiro, corrigir as funções que fazem referência às tabelas allocation removidas
CREATE OR REPLACE FUNCTION public.clean_completed_wave_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Como as tabelas allocation_waves foram removidas, apenas limpar todas as reservas temporárias
    UPDATE public.storage_positions
    SET 
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL
    WHERE reservado_temporariamente = true 
      AND reservado_por_wave_id IS NOT NULL;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RAISE LOG 'Cleaned % reservations (allocation waves system removed)', cleaned_count;
    RETURN cleaned_count;
END;
$function$;

-- Atualizar a função clean_expired_reservations para não depender de allocation_waves
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
      AND reservado_por_wave_id IS NOT NULL;
    
    GET DIAGNOSTICS orphan_count = ROW_COUNT;
    cleaned_count := cleaned_count + orphan_count;
    
    RAISE LOG 'Total cleaned reservations: %', cleaned_count;
    RETURN cleaned_count;
END;
$function$;

-- Agora limpar os registros órfãos da tabela movimentacoes
DELETE FROM public.movimentacoes 
WHERE referencia_tipo IN ('allocation_wave', 'allocation_wave_pallet');

-- Adicionar constraint para validar referencia_tipo e prevenir futuros problemas
ALTER TABLE public.movimentacoes 
ADD CONSTRAINT valid_referencia_tipo 
CHECK (referencia_tipo IN ('entrada', 'saida', 'pallet', 'inventario', 'ajuste'));

-- Atualizar view materializada do estoque após limpeza
REFRESH MATERIALIZED VIEW CONCURRENTLY public.estoque;