-- ================================================
-- FIX: Infinite Recursion in franquias RLS
-- ================================================

-- 1) Drop all existing policies on public.franquias
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'franquias'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.franquias';
  END LOOP;
END $$;

-- 2) Create minimal, non-recursive policies using helper functions

-- SELECT: admins see all; others see franquias where they belong via franquia_usuarios
CREATE POLICY "franquias_select_policy"
ON public.franquias
FOR SELECT
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_belongs_to_franquia(auth.uid(), id)
);

-- INSERT: only admins can create deposits
CREATE POLICY "franquias_insert_policy"
ON public.franquias
FOR INSERT
WITH CHECK (
  public.get_user_role_direct(auth.uid()) = 'admin'
);

-- UPDATE: admins can update any; masters can update their own franquias
CREATE POLICY "franquias_update_policy"
ON public.franquias
FOR UPDATE
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_belongs_to_franquia(auth.uid(), id)
)
WITH CHECK (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_belongs_to_franquia(auth.uid(), id)
);

-- DELETE: only admins can delete deposits
CREATE POLICY "franquias_delete_policy"
ON public.franquias
FOR DELETE
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
);
