
-- ============================================
-- FIX: Storage Positions RLS Policies
-- ============================================
-- Problem: Admins and franqueados cannot see all positions due to overly restrictive policies
-- Solution: Simplify policies to properly check roles and hierarchy

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all positions" ON public.storage_positions;
DROP POLICY IF EXISTS "Franqueados can manage positions in their deposits" ON public.storage_positions;
DROP POLICY IF EXISTS "Users can view storage positions" ON public.storage_positions;

-- ============================================
-- NEW SIMPLIFIED POLICIES
-- ============================================

-- 1. Admins can do EVERYTHING (no restrictions)
CREATE POLICY "Admins full access to all positions"
ON public.storage_positions
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Franqueados can SELECT positions in their deposits
CREATE POLICY "Franqueados can view their deposit positions"
ON public.storage_positions
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'franqueado'::app_role)
  AND deposito_id IN (
    SELECT f.id
    FROM franquias f
    WHERE f.master_franqueado_id = auth.uid()
       OR is_ancestor(f.master_franqueado_id, auth.uid())
  )
);

-- 3. Franqueados can INSERT/UPDATE/DELETE positions in their deposits
CREATE POLICY "Franqueados can manage their deposit positions"
ON public.storage_positions
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'franqueado'::app_role)
  AND deposito_id IN (
    SELECT f.id
    FROM franquias f
    WHERE f.master_franqueado_id = auth.uid()
       OR is_ancestor(f.master_franqueado_id, auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'franqueado'::app_role)
  AND deposito_id IN (
    SELECT f.id
    FROM franquias f
    WHERE f.master_franqueado_id = auth.uid()
       OR is_ancestor(f.master_franqueado_id, auth.uid())
  )
);

-- 4. Produtores can VIEW positions in deposits they have access to
CREATE POLICY "Produtores can view positions in assigned deposits"
ON public.storage_positions
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'produtor'::app_role)
  AND deposito_id IN (
    SELECT DISTINCT e.deposito_id
    FROM entradas e
    WHERE e.user_id = auth.uid()
      AND e.deposito_id IS NOT NULL
    UNION
    SELECT DISTINCT s.deposito_id
    FROM saidas s
    WHERE s.user_id = auth.uid()
      AND s.deposito_id IS NOT NULL
  )
);

-- ============================================
-- COMMENT: Explanation
-- ============================================
COMMENT ON POLICY "Admins full access to all positions" ON public.storage_positions IS 
'Admins have unrestricted access to all storage positions across all deposits';

COMMENT ON POLICY "Franqueados can view their deposit positions" ON public.storage_positions IS 
'Franqueados can view all positions in deposits they own or have hierarchy access to';

COMMENT ON POLICY "Franqueados can manage their deposit positions" ON public.storage_positions IS 
'Franqueados can create, update, and delete positions in their deposits';

COMMENT ON POLICY "Produtores can view positions in assigned deposits" ON public.storage_positions IS 
'Produtores can view positions in deposits where they have entradas or saidas';
