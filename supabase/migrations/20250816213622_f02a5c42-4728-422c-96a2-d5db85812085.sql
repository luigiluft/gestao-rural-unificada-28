-- Add a more direct policy for franchisees to view entries
CREATE POLICY "Franqueados podem ver todas as entradas" ON public.entradas
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado'::app_role)
);