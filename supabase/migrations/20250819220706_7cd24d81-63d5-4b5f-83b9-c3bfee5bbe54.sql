-- Simplify RLS policies to allow authenticated users to see allocation waves
DROP POLICY IF EXISTS "Admins can manage all allocation waves" ON allocation_waves;
DROP POLICY IF EXISTS "Franqueados can manage allocation waves in their deposits" ON allocation_waves;
DROP POLICY IF EXISTS "Users can view allocation waves assigned to them" ON allocation_waves;
DROP POLICY IF EXISTS "Produtores can view allocation waves from their entries" ON allocation_waves;

-- Create simpler policies that work for all authenticated users
CREATE POLICY "Authenticated users can view allocation waves" 
ON allocation_waves 
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and franqueados can manage allocation waves" 
ON allocation_waves 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'franqueado'::app_role)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'franqueado'::app_role)
  )
);