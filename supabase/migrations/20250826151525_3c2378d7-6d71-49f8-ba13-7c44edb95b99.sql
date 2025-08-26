-- Reset das ondas de alocação para teste
-- Voltar status das ondas para pendente
UPDATE public.allocation_waves 
SET 
    status = 'pendente',
    data_inicio = NULL,
    data_conclusao = NULL,
    funcionario_id = NULL,
    updated_at = now()
WHERE numero_onda IN ('WAVE-20250826-0bf4b59c', 'WAVE-20250826-1da87a8f');

-- Resetar todos os pallets dessas ondas
UPDATE public.allocation_wave_pallets 
SET 
    status = 'pendente',
    posicao_id = NULL,
    produtos_conferidos = '[]'::jsonb,
    divergencias = '[]'::jsonb,
    data_alocacao = NULL,
    alocado_por = NULL,
    updated_at = now()
WHERE wave_id IN (
    SELECT id FROM public.allocation_waves 
    WHERE numero_onda IN ('WAVE-20250826-0bf4b59c', 'WAVE-20250826-1da87a8f')
);

-- Limpar todas as reservas de posições dessas ondas
UPDATE public.storage_positions
SET 
    ocupado = false,
    reservado_temporariamente = false,
    reservado_ate = NULL,
    reservado_por_wave_id = NULL,
    updated_at = now()
WHERE reservado_por_wave_id IN (
    SELECT id FROM public.allocation_waves 
    WHERE numero_onda IN ('WAVE-20250826-0bf4b59c', 'WAVE-20250826-1da87a8f')
);

-- Remover estoque criado por essas ondas
DELETE FROM public.estoque 
WHERE EXISTS (
    SELECT 1 FROM public.movimentacoes m
    WHERE m.referencia_id IN (
        SELECT id FROM public.allocation_waves 
        WHERE numero_onda IN ('WAVE-20250826-0bf4b59c', 'WAVE-20250826-1da87a8f')
    )
    AND m.referencia_tipo = 'allocation_wave_pallet'
    AND m.produto_id = estoque.produto_id
    AND m.deposito_id = estoque.deposito_id
);

-- Remover movimentações criadas por essas ondas
DELETE FROM public.movimentacoes 
WHERE referencia_id IN (
    SELECT id FROM public.allocation_waves 
    WHERE numero_onda IN ('WAVE-20250826-0bf4b59c', 'WAVE-20250826-1da87a8f')
)
AND referencia_tipo = 'allocation_wave_pallet';