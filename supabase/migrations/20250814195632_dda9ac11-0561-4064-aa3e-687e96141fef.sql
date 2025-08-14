-- Fix RLS policies for franquias table to allow proper access
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all franquias" ON public.franquias;
DROP POLICY IF EXISTS "Franqueados can view their own franquia" ON public.franquias;
DROP POLICY IF EXISTS "Master franqueados can update their franquia" ON public.franquias;

-- Create new policies with proper SELECT access
CREATE POLICY "Admins can select all franquias" 
ON public.franquias 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert franquias" 
ON public.franquias 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update franquias" 
ON public.franquias 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete franquias" 
ON public.franquias 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can view their own franquia" 
ON public.franquias 
FOR SELECT 
USING (
  (auth.uid() = master_franqueado_id) OR 
  (EXISTS (
    SELECT 1 FROM user_hierarchy uh 
    WHERE uh.child_user_id = auth.uid() 
    AND uh.parent_user_id = franquias.master_franqueado_id
  ))
);

CREATE POLICY "Master franqueados can update their franquia" 
ON public.franquias 
FOR UPDATE 
USING (auth.uid() = master_franqueado_id)
WITH CHECK (auth.uid() = master_franqueado_id);