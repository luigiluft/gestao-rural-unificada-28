-- Update the get_producer_available_deposits function to respect user hierarchy
CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id uuid)
 RETURNS TABLE(deposito_id uuid, deposito_nome text, franqueado_id uuid, franqueado_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- If the user is an admin, return all active franquias
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _producer_id AND role = 'admin') THEN
    RETURN QUERY
    SELECT 
      f.id as deposito_id,
      f.nome as deposito_nome,
      p.user_id as franqueado_id,
      p.nome as franqueado_nome
    FROM public.franquias f
    JOIN public.profiles p ON p.user_id = f.master_franqueado_id
    WHERE f.ativo = true
      AND p.role = 'franqueado'
    ORDER BY p.nome, f.nome;
    RETURN;
  END IF;

  -- For producers, only return franquias from their linked franqueados through user_hierarchy
  RETURN QUERY
  SELECT 
    f.id as deposito_id,
    f.nome as deposito_nome,
    p.user_id as franqueado_id,
    p.nome as franqueado_nome
  FROM public.user_hierarchy uh
  JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
  JOIN public.franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
  WHERE uh.child_user_id = _producer_id
  ORDER BY p.nome, f.nome;
END;
$function$