-- Add RLS policy for franqueados to view entrada_itens in their franquia
CREATE POLICY "Franqueados can view entrada_itens in their franquia"
ON public.entrada_itens
FOR SELECT
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM entradas e
    JOIN franquias f ON f.id = e.deposito_id
    WHERE e.id = entrada_itens.entrada_id 
    AND f.master_franqueado_id = auth.uid()
  )
);

-- Also add a broader policy for all authenticated users to view entrada_itens (matching the debug policy on entradas)
CREATE POLICY "Debug - authenticated users can view entrada_itens"
ON public.entrada_itens
FOR SELECT
USING (auth.uid() IS NOT NULL);