-- Fix RLS policies to allow admin XML import and producer franchise finding

-- 1. Allow admins to create fornecedores for any user
DROP POLICY IF EXISTS "Insert own rows" ON public.fornecedores;
CREATE POLICY "Insert own rows or admin can insert for any user" 
ON public.fornecedores 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Allow producers to view active franchises (needed for franchise finding from XML delivery data)
DROP POLICY IF EXISTS "Producers can view active franchises" ON public.franquias;
CREATE POLICY "Producers can view active franchises" 
ON public.franquias 
FOR SELECT 
USING (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND ativo = true
);

-- 3. Modify get_producer_available_deposits to return ALL active franchises
-- This ensures that the identified franchise from XML appears in the selector
CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id uuid)
 RETURNS TABLE(deposito_id uuid, deposito_nome text, franqueado_id uuid, franqueado_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Return all active franquias for any user (admin, franqueado, or produtor)
  -- This allows the auto-identified franchise to appear in the selector
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
$function$;

-- 4. Allow admins to manage entrada_itens for any user
DROP POLICY IF EXISTS "Admins can manage all entrada_itens" ON public.entrada_itens;
CREATE POLICY "Admins can manage all entrada_itens" 
ON public.entrada_itens 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Allow admins to manage entradas for any user  
DROP POLICY IF EXISTS "Admins can manage all entradas" ON public.entradas;
CREATE POLICY "Admins can manage all entradas" 
ON public.entradas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));