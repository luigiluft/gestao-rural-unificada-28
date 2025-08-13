-- Remove all existing policies from user_roles that can cause recursion
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Parents can grant their role to descendants" ON public.user_roles;  
DROP POLICY IF EXISTS "Parents can revoke their role from descendants" ON public.user_roles;
DROP POLICY IF EXISTS "Parents can view descendant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Ensure the security definer function exists and is properly configured
CREATE OR REPLACE FUNCTION public.check_user_role_safe(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Update has_role function to use the safe version
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.check_user_role_safe(_user_id, _role);
$$;

-- Create simple, non-recursive policies for user_roles
CREATE POLICY "Allow authenticated users to view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role full access (needed for admin operations)
CREATE POLICY "Allow service role full access" 
ON public.user_roles 
FOR ALL 
TO service_role
USING (true);

-- Admin policy that uses the security definer function (no recursion)
CREATE POLICY "Admins can manage all user roles via safe function" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.check_user_role_safe(auth.uid(), 'admin'::app_role))
WITH CHECK (public.check_user_role_safe(auth.uid(), 'admin'::app_role));