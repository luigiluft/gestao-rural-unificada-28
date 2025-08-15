-- Remove foreign key constraints that reference depositos table
ALTER TABLE public.entradas DROP CONSTRAINT IF EXISTS entradas_deposito_id_fkey;
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_deposito_id_fkey;
ALTER TABLE public.saidas DROP CONSTRAINT IF EXISTS saidas_deposito_id_fkey;
ALTER TABLE public.movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_deposito_id_fkey;

-- Update get_producer_available_deposits function to use franquias
CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id uuid)
 RETURNS TABLE(deposito_id uuid, deposito_nome text, franqueado_id uuid, franqueado_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $$
BEGIN
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
END;
$$;