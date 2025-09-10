-- Proteger a view materializada estoque removendo do schema público via API
-- Isso evita acesso direto através da API REST
REVOKE ALL ON public.estoque FROM anon, authenticated;

-- Garantir que apenas a função segura seja usada
GRANT EXECUTE ON FUNCTION public.get_estoque_seguro() TO authenticated;