-- Remove categoria and category columns from produtos table
ALTER TABLE public.produtos 
DROP COLUMN IF EXISTS categoria,
DROP COLUMN IF EXISTS category;