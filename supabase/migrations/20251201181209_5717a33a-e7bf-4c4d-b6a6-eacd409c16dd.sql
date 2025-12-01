-- Fix RLS policies for entradas table to allow operators to see entries from their deposits
-- This fixes the issue where pallet_positions RLS fails because it can't access entradas

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "entradas_select" ON public.entradas;

-- Create new SELECT policy that allows:
-- 1. Users to see their own entries
-- 2. Admins to see all entries
-- 3. Operators to see entries from deposits they belong to via franquia_usuarios
CREATE POLICY "entradas_select" ON public.entradas
FOR SELECT USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = entradas.deposito_id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
  )
);

-- Also update UPDATE policy for consistency
DROP POLICY IF EXISTS "entradas_update" ON public.entradas;

CREATE POLICY "entradas_update" ON public.entradas
FOR UPDATE USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = entradas.deposito_id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
  )
);

-- Also update DELETE policy for consistency
DROP POLICY IF EXISTS "entradas_delete" ON public.entradas;

CREATE POLICY "entradas_delete" ON public.entradas
FOR DELETE USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = entradas.deposito_id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
  )
);