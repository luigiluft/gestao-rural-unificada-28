-- Create RLS policies for viagens table

-- Policy for users to view viagens in their franchise
CREATE POLICY "Users can view viagens in their franchise" 
ON public.viagens 
FOR SELECT 
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role) OR 
  -- Franqueados can see viagens in their franchise
  (has_role(auth.uid(), 'franqueado'::app_role) AND deposito_id IN (
    SELECT f.id FROM franquias f WHERE f.master_franqueado_id = auth.uid()
  )) OR
  -- Users can see viagens they created
  user_id = auth.uid()
);

-- Policy for creating viagens
CREATE POLICY "Users can create viagens in their franchise"
ON public.viagens
FOR INSERT
WITH CHECK (
  -- Admins can create anywhere
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Franqueados can create in their franchise  
  (has_role(auth.uid(), 'franqueado'::app_role) AND deposito_id IN (
    SELECT f.id FROM franquias f WHERE f.master_franqueado_id = auth.uid()
  )) OR
  -- Users can create their own
  user_id = auth.uid()
);

-- Policy for updating viagens
CREATE POLICY "Users can update viagens they manage"
ON public.viagens
FOR UPDATE
USING (
  -- Admins can update all
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Franqueados can update viagens in their franchise
  (has_role(auth.uid(), 'franqueado'::app_role) AND deposito_id IN (
    SELECT f.id FROM franquias f WHERE f.master_franqueado_id = auth.uid()
  )) OR
  -- Users can update their own
  user_id = auth.uid()
);

-- Policy for deleting viagens  
CREATE POLICY "Users can delete viagens they manage"
ON public.viagens
FOR DELETE
USING (
  -- Admins can delete all
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Franqueados can delete viagens in their franchise
  (has_role(auth.uid(), 'franqueado'::app_role) AND deposito_id IN (
    SELECT f.id FROM franquias f WHERE f.master_franqueado_id = auth.uid()
  )) OR
  -- Users can delete their own
  user_id = auth.uid()
);