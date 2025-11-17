-- Fix infinite recursion in RLS policies for cliente_usuarios and clientes
-- 1) Create safe helper to check if user is admin of a cliente (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.user_is_cliente_admin(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cliente_usuarios
    WHERE cliente_id = _cliente_id
      AND user_id = _user_id
      AND papel = 'administrador'
      AND ativo = true
  );
$$;

-- 2) Drop problematic recursive policies
DROP POLICY IF EXISTS "Client admins can manage cliente_usuarios" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Client admins can manage cliente" ON public.clientes;
DROP POLICY IF EXISTS "Users can view their clientes" ON public.clientes; -- used subquery on cliente_usuarios

-- 3) Recreate safe policies that avoid direct self-references
-- cliente_usuarios: allow admins or cliente admins via function
CREATE POLICY "Client admins can manage cliente_usuarios"
ON public.cliente_usuarios
AS PERMISSIVE
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR public.user_is_cliente_admin(auth.uid(), cliente_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR public.user_is_cliente_admin(auth.uid(), cliente_id)
);

-- clientes: view/manage using functions without subqueries
CREATE POLICY "Users can view associated clientes"
ON public.clientes
AS PERMISSIVE
FOR SELECT
USING (
  auth.uid() = created_by OR public.user_has_cliente_association(auth.uid(), id)
);

CREATE POLICY "Client admins can manage cliente"
ON public.clientes
AS PERMISSIVE
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = created_by OR public.user_is_cliente_admin(auth.uid(), id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = created_by OR public.user_is_cliente_admin(auth.uid(), id)
);
