-- Add missing data_finalizacao column to inventarios table
ALTER TABLE public.inventarios 
ADD COLUMN IF NOT EXISTS data_finalizacao timestamp with time zone;