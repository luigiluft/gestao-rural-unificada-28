-- Fix the user_can_access_saida_item function to use fully qualified type
CREATE OR REPLACE FUNCTION public.user_can_access_saida_item(p_saida_item_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (si.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  FROM public.saida_itens si
  WHERE si.id = p_saida_item_id;
$$;