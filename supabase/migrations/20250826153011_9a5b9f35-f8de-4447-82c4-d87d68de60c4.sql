-- Limpar posições ocupadas sem estoque real para BARUERI-01
UPDATE public.storage_positions
SET 
    ocupado = false,
    reservado_temporariamente = false,
    reservado_ate = NULL,
    reservado_por_wave_id = NULL,
    updated_at = now()
WHERE deposito_id = (
    SELECT id FROM public.franquias WHERE nome = 'BARUERI-01'
)
AND ocupado = true
AND id NOT IN (
    SELECT DISTINCT sp.id
    FROM storage_positions sp
    JOIN estoque e ON e.posicao_id = sp.id
    WHERE e.quantidade_atual > 0
    AND sp.deposito_id = (SELECT id FROM public.franquias WHERE nome = 'BARUERI-01')
);