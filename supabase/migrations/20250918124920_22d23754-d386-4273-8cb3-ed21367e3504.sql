-- Remove old materialized view and function
DROP MATERIALIZED VIEW IF EXISTS public.estoque;
DROP FUNCTION IF EXISTS public.get_estoque_seguro();

-- Remove refresh function as it's no longer needed
DROP FUNCTION IF EXISTS public.refresh_estoque_with_retry();