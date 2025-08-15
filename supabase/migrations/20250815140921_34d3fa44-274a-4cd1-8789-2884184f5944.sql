-- Modify the function to return all active deposits from franchisees
-- instead of only authorized ones from the relationship table
CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id uuid)
 RETURNS TABLE(deposito_id uuid, deposito_nome text, franqueado_id uuid, franqueado_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as deposito_id,
    d.nome as deposito_nome,
    p.user_id as franqueado_id,
    p.nome as franqueado_nome
  FROM public.depositos d
  JOIN public.profiles p ON p.user_id = d.user_id
  WHERE d.ativo = true
    AND p.role = 'franqueado'
  ORDER BY p.nome, d.nome;
END;
$function$