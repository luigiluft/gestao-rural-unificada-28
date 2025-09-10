-- Create a secure function to check if a franqueado can view a producer
CREATE OR REPLACE FUNCTION public.franqueado_can_view_producer(franqueado_id uuid, producer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the producer has stock in any franchise managed by the franqueado
  RETURN EXISTS (
    SELECT 1 
    FROM public.get_estoque_seguro() e
    JOIN public.franquias f ON f.id = e.deposito_id
    WHERE f.master_franqueado_id = franqueado_id
    AND e.user_id = producer_id
    AND e.quantidade_atual > 0
  );
END;
$$;

-- Drop the problematic RLS policy
DROP POLICY IF EXISTS "Franqueados can view producers with stock in their franchise" ON public.profiles;

-- Create a new secure RLS policy for franqueados to view producers
CREATE POLICY "Franqueados can view producers with stock in their franchise"
ON public.profiles
FOR SELECT
USING (
  role = 'produtor'::app_role 
  AND has_role(auth.uid(), 'franqueado'::app_role)
  AND public.franqueado_can_view_producer(auth.uid(), user_id)
);