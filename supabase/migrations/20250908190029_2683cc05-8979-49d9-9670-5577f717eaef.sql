-- Fix RLS policy for fornecedores to allow franqueados to insert suppliers during XML import

-- Drop existing policy
DROP POLICY IF EXISTS "Insert own rows or admin/franqueado can insert for any user" ON public.fornecedores;

-- Create new policy that allows franqueados to insert fornecedores for any user
CREATE POLICY "Insert own rows or admin/franqueado can insert" 
ON public.fornecedores 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'franqueado'::app_role)
);

-- Also check if we need to update the SELECT policy for fornecedores
-- to allow franqueados to view suppliers they create
CREATE POLICY "Franqueados can view all fornecedores" 
ON public.fornecedores 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'franqueado'::app_role)
  OR auth.uid() = user_id
);