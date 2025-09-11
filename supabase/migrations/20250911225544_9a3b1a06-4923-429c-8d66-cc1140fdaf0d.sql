-- Drop the existing incorrect policy for franqueados
DROP POLICY IF EXISTS "Franqueados can view their producers fazendas" ON public.fazendas;

-- Create corrected policy using the actual data relationship
CREATE POLICY "Franqueados can view fazendas of their produtores"
ON public.fazendas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.produtores p
    JOIN public.franquias f ON f.id = p.franquia_id
    WHERE p.user_id = fazendas.produtor_id 
    AND f.master_franqueado_id = auth.uid()
    AND f.ativo = true
    AND p.ativo = true
  )
);