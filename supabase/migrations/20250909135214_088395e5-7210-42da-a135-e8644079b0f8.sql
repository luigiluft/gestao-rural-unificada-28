-- Add RLS policy for franqueados to view saida_itens in their franquia
CREATE POLICY "Franqueados can view saida_itens in their franquia deposits" 
ON public.saida_itens 
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND EXISTS (
    SELECT 1 FROM saidas s
    JOIN franquias f ON f.id = s.deposito_id
    WHERE s.id = saida_itens.saida_id 
    AND f.master_franqueado_id = auth.uid()
  )
);