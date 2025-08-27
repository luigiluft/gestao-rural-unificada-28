-- Corrigir refresh da view materializada removendo CONCURRENTLY
-- CONCURRENTLY requer índices únicos que a view não possui

-- Atualizar a função refresh_estoque para não usar CONCURRENTLY
CREATE OR REPLACE FUNCTION public.refresh_estoque()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    REFRESH MATERIALIZED VIEW estoque;
    RAISE LOG 'Materialized view estoque refreshed successfully';
END;
$function$;

-- Fazer refresh imediato sem CONCURRENTLY
REFRESH MATERIALIZED VIEW estoque;