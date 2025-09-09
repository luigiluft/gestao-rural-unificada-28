-- Add RLS policy to allow producers to view products in saidas where they are the destinatario
CREATE POLICY "Produtores can view products in saidas for them" 
ON public.produtos FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.saida_itens si
    JOIN public.saidas s ON s.id = si.saida_id
    WHERE si.produto_id = produtos.id 
    AND s.produtor_destinatario_id = auth.uid()
  )
);