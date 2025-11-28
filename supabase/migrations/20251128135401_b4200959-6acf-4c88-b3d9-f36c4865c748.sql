-- Create helper functions for cliente_usuarios RLS policies to avoid infinite recursion
-- Similar to the franquia_usuarios helper functions

-- Check if a user is a member of a specific cliente
CREATE OR REPLACE FUNCTION public.user_is_cliente_member(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.cliente_usuarios cu
    WHERE cu.user_id = _user_id 
      AND cu.cliente_id = _cliente_id 
      AND cu.ativo = true
  );
$$;

-- Check if a user is an admin of any cliente (used for general cliente access)
CREATE OR REPLACE FUNCTION public.user_has_cliente_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.cliente_usuarios cu
    WHERE cu.user_id = _user_id 
      AND cu.ativo = true
  );
$$;

-- Now drop the existing recursive policies and create new ones using helper functions
ALTER TABLE public.cliente_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cliente_usuarios_select_policy ON public.cliente_usuarios;
DROP POLICY IF EXISTS cliente_usuarios_insert_policy ON public.cliente_usuarios;
DROP POLICY IF EXISTS cliente_usuarios_update_policy ON public.cliente_usuarios;
DROP POLICY IF EXISTS cliente_usuarios_delete_policy ON public.cliente_usuarios;

-- Consolidated SELECT policy
CREATE POLICY cliente_usuarios_select_policy
ON public.cliente_usuarios
AS PERMISSIVE
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_is_cliente_member(auth.uid(), cliente_id)
);

-- Consolidated INSERT policy
CREATE POLICY cliente_usuarios_insert_policy
ON public.cliente_usuarios
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_is_cliente_member(auth.uid(), cliente_id)
);

-- Consolidated UPDATE policy
CREATE POLICY cliente_usuarios_update_policy
ON public.cliente_usuarios
AS PERMISSIVE
FOR UPDATE
TO public
USING (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_is_cliente_member(auth.uid(), cliente_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_is_cliente_member(auth.uid(), cliente_id)
);

-- Consolidated DELETE policy
CREATE POLICY cliente_usuarios_delete_policy
ON public.cliente_usuarios
AS PERMISSIVE
FOR DELETE
TO public
USING (
  auth.uid() = user_id
  OR public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_is_cliente_member(auth.uid(), cliente_id)
);
