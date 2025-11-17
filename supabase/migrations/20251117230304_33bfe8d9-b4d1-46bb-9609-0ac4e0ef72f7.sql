-- Fix infinite recursion in cliente_usuarios RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own cliente associations" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Users can insert their own cliente associations" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Users can update their own cliente associations" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Users can delete their own cliente associations" ON public.cliente_usuarios;

-- Create security definer function to check if user owns a client
CREATE OR REPLACE FUNCTION public.user_is_cliente_owner(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clientes
    WHERE id = _cliente_id
      AND created_by = _user_id
  )
$$;

-- Create security definer function to check if user is associated with a client
CREATE OR REPLACE FUNCTION public.user_has_cliente_association(_user_id uuid, _cliente_id uuid)
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
      AND ativo = true
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view their cliente associations"
ON public.cliente_usuarios
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = created_by
  OR public.user_is_cliente_owner(auth.uid(), cliente_id)
);

CREATE POLICY "Users can insert cliente associations"
ON public.cliente_usuarios
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  OR public.user_is_cliente_owner(auth.uid(), cliente_id)
);

CREATE POLICY "Users can update their cliente associations"
ON public.cliente_usuarios
FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.user_is_cliente_owner(auth.uid(), cliente_id)
);

CREATE POLICY "Users can delete their cliente associations"
ON public.cliente_usuarios
FOR DELETE
USING (
  auth.uid() = created_by
  OR public.user_is_cliente_owner(auth.uid(), cliente_id)
);

-- Also fix clientes table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can update their own clientes" ON public.clientes;

CREATE POLICY "Users can view their own clientes"
ON public.clientes
FOR SELECT
USING (
  auth.uid() = created_by
);

CREATE POLICY "Users can insert their own clientes"
ON public.clientes
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can update their own clientes"
ON public.clientes
FOR UPDATE
USING (
  auth.uid() = created_by
);