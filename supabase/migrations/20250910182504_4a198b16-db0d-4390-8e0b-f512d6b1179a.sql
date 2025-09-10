-- Add foreign key constraint between saidas.deposito_id and franquias.id
-- This will enable the automatic JOIN in useSaidas hook and fix the empty list issue

ALTER TABLE public.saidas 
ADD CONSTRAINT saidas_deposito_id_fkey 
FOREIGN KEY (deposito_id) 
REFERENCES public.franquias(id);