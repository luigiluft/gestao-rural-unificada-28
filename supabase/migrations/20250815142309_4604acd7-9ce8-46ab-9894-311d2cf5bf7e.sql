-- Now update the data to reference franquias instead of depositos
UPDATE public.entradas 
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE entradas.deposito_id = d.id;

UPDATE public.estoque
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE estoque.deposito_id = d.id;

UPDATE public.saidas
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE saidas.deposito_id = d.id;

UPDATE public.movimentacoes
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE movimentacoes.deposito_id = d.id;