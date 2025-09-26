-- Remove remessa_id column from saidas table
ALTER TABLE public.saidas DROP COLUMN IF EXISTS remessa_id;

-- Drop viagem_remessas table (depends on remessas)
DROP TABLE IF EXISTS public.viagem_remessas;

-- Drop remessas table
DROP TABLE IF EXISTS public.remessas;