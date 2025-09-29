-- Add is_avaria column to entrada_pallet_itens table
ALTER TABLE public.entrada_pallet_itens 
ADD COLUMN is_avaria boolean NOT NULL DEFAULT false;

-- Migrate existing data: mark items as avaria if they are in pallets with 'avaria' in description
UPDATE public.entrada_pallet_itens 
SET is_avaria = true
FROM public.entrada_pallets ep
WHERE ep.id = entrada_pallet_itens.pallet_id 
AND ep.descricao ILIKE '%avaria%';