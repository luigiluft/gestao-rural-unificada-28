-- Add volume/pallet tracking fields to entrada_itens
ALTER TABLE public.entrada_itens 
ADD COLUMN volumes numeric,
ADD COLUMN pallets numeric, 
ADD COLUMN volumes_por_pallet numeric;