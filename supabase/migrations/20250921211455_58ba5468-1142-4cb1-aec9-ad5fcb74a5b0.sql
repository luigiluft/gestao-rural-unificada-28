-- Drop dependent tables and columns first
DROP TABLE IF EXISTS public.viagem_remessas CASCADE;
DROP TABLE IF EXISTS public.remessa_saidas CASCADE;

-- Remove foreign key constraints that reference remessas
ALTER TABLE public.tracking_entregas DROP CONSTRAINT IF EXISTS tracking_entregas_remessa_id_fkey;
ALTER TABLE public.saidas DROP CONSTRAINT IF EXISTS saidas_remessa_id_fkey;

-- Remove remessa_id column from saidas and tracking_entregas
ALTER TABLE public.saidas DROP COLUMN IF EXISTS remessa_id;
ALTER TABLE public.tracking_entregas DROP COLUMN IF EXISTS remessa_id;

-- Finally drop remessas table
DROP TABLE IF EXISTS public.remessas CASCADE;