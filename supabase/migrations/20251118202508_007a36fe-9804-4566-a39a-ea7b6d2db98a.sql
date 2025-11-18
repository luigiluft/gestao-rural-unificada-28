-- Create SECURITY DEFINER helper functions to break RLS circular dependencies

-- Function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = p_user_id;
$$;

-- Function to check if user is a member of a franchise (any role)
CREATE OR REPLACE FUNCTION public.user_is_franquia_member(p_user_id UUID, p_franquia_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.franquia_usuarios
    WHERE user_id = p_user_id 
      AND franquia_id = p_franquia_id 
      AND ativo = true
  );
$$;

-- Function to check if user is a master of a franchise
CREATE OR REPLACE FUNCTION public.user_is_franquia_master(p_user_id UUID, p_franquia_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.franquia_usuarios
    WHERE user_id = p_user_id 
      AND franquia_id = p_franquia_id 
      AND papel = 'master'
      AND ativo = true
  );
$$;

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can view their franchise associations" ON public.franquia_usuarios;
DROP POLICY IF EXISTS "Admins can manage all franchise associations" ON public.franquia_usuarios;
DROP POLICY IF EXISTS "Franqueados can view franchises they belong to" ON public.franquias;
DROP POLICY IF EXISTS "Franqueados can update their franchises" ON public.franquias;

-- Recreate RLS policies for franquia_usuarios using helper functions
CREATE POLICY "Users can view their franchise associations"
ON public.franquia_usuarios
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins can manage all franchise associations"
ON public.franquia_usuarios
FOR ALL
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Recreate RLS policies for franquias using helper functions
CREATE POLICY "Franqueados can view franchises they belong to"
ON public.franquias
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'admin'
  OR public.user_is_franquia_member(auth.uid(), id)
);

CREATE POLICY "Franqueados can update their franchises"
ON public.franquias
FOR UPDATE
USING (
  public.get_user_role(auth.uid()) = 'admin'
  OR public.user_is_franquia_master(auth.uid(), id)
)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
  OR public.user_is_franquia_master(auth.uid(), id)
);