-- Remove all problematic RLS policies from user_roles and recreate them properly
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Parents can grant their role to descendants" ON public.user_roles;  
DROP POLICY IF EXISTS "Parents can revoke their role from descendants" ON public.user_roles;
DROP POLICY IF EXISTS "Parents can view descendant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Allow authenticated users to view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow service role full access" 
ON public.user_roles 
FOR ALL 
TO service_role
USING (true);

-- Create admin policy using direct check instead of function
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);