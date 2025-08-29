-- Update RLS policies for employee_profiles to support hierarchy visibility

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "Users can create their own employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "Users can update their own employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "Users can delete their own employee profiles" ON public.employee_profiles;

-- Create new RLS policies with hierarchy support
CREATE POLICY "Users can view employee profiles with hierarchy"
ON public.employee_profiles
FOR SELECT
USING (
  -- Users can see their own profiles
  user_id = auth.uid()
  OR
  -- Franqueados can see produtor profiles (but not vice-versa)
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'franqueado'
    )
    AND role = 'produtor'
  )
);

CREATE POLICY "Users can create their own employee profiles"
ON public.employee_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own employee profiles"
ON public.employee_profiles
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own employee profiles"
ON public.employee_profiles
FOR DELETE
USING (user_id = auth.uid());