-- Remove the problematic trigger that references non-existent allocation_waves table
DROP TRIGGER IF EXISTS create_allocation_wave_on_entrada_approved ON public.entradas;

-- Remove the associated function
DROP FUNCTION IF EXISTS public.create_allocation_wave_on_entrada_approved();