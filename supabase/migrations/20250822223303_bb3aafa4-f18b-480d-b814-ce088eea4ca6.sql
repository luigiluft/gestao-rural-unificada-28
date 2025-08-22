-- Deletar dados de teste da alocação
DELETE FROM public.allocation_wave_items WHERE wave_id IN (
  SELECT id FROM public.allocation_waves WHERE numero_onda LIKE 'WAVE-TEST-%'
);

DELETE FROM public.allocation_waves WHERE numero_onda LIKE 'WAVE-TEST-%';

DELETE FROM public.entrada_itens WHERE entrada_id IN (
  SELECT id FROM public.entradas WHERE numero_nfe = 'TEST-001'
);

DELETE FROM public.entradas WHERE numero_nfe = 'TEST-001';

DELETE FROM public.produtos WHERE nome = 'Produto Teste Alocação';

DELETE FROM public.franquias WHERE nome = 'Depósito Teste';