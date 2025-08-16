-- Add RLS policy for franchisees to view entries in their franchise deposits
CREATE POLICY "Franqueados can view entries in their franquia deposits" ON public.entradas
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND deposito_id IN (
    SELECT f.id FROM public.franquias f 
    WHERE f.master_franqueado_id = auth.uid()
  )
);