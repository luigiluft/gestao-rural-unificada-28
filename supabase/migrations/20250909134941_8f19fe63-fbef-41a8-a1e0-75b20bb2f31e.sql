-- Fix has_role function to check both user_roles and profiles tables
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Check both user_roles (for backwards compatibility) and profiles table
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles  
    WHERE user_id = _user_id AND role = _role
  );
$$;