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
CREATE POLICY "Producers can view active franchises" 
ON public.franquias 
FOR SELECT 
USING (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND ativo = true
);