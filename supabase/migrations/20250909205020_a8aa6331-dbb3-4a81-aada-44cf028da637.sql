-- Drop the problematic policy and update the existing one to be more comprehensive
DROP POLICY IF EXISTS "Produtores can view products in saidas for them" ON public.produtos;

-- Update the existing producer policy to include products in saidas where they are destinatario
DROP POLICY IF EXISTS "Produtores can view all active products" ON public.produtos;

CREATE POLICY "Produtores can view all active products and products in their saidas" 
ON public.produtos FOR SELECT 
USING (
  has_role(auth.uid(), 'produtor'::app_role) AND (
    ativo = true OR
    EXISTS (
      SELECT 1 FROM public.saida_itens si
      JOIN public.saidas s ON s.id = si.saida_id
      WHERE si.produto_id = produtos.id 
      AND s.produtor_destinatario_id = auth.uid()
    )
  )
);