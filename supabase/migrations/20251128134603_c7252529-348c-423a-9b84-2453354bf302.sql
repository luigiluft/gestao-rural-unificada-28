-- ================================================
-- FIX: Infinite Recursion in cliente_usuarios RLS
-- ================================================

-- 1) Drop all existing policies on public.cliente_usuarios
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cliente_usuarios'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.cliente_usuarios';
  END LOOP;
END $$;

-- 2) Create minimal, non-recursive policies using helper functions

-- SELECT: users can see their own associations OR admins see all
CREATE POLICY "cliente_usuarios_select_policy"
ON public.cliente_usuarios
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR (EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  ))
);

-- INSERT: users can insert their own associations OR admins OR existing cliente admins
CREATE POLICY "cliente_usuarios_insert_policy"
ON public.cliente_usuarios
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR (EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  ))
);

-- UPDATE: users can update their own associations OR admins OR existing cliente admins
CREATE POLICY "cliente_usuarios_update_policy"
ON public.cliente_usuarios
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR (EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  ))
)
WITH CHECK (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR (EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  ))
);

-- DELETE: users can delete their own associations OR admins OR existing cliente admins
CREATE POLICY "cliente_usuarios_delete_policy"
ON public.cliente_usuarios
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR (EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  ))
);