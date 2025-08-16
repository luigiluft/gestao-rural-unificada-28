-- Temporarily allow all authenticated users to view entries for debugging
CREATE POLICY "Debug - authenticated users can view entries" ON public.entradas
FOR SELECT USING (auth.uid() IS NOT NULL);