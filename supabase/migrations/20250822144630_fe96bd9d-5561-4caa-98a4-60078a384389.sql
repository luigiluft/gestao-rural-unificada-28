-- Remove old restrictive policies
DROP POLICY IF EXISTS "Select visible rows by hierarchy" ON public.produtos;

-- Create new policies for better product visibility in catalog

-- Franqueados can view all active products
CREATE POLICY "Franqueados can view all products" 
ON public.produtos 
FOR SELECT 
USING (has_role(auth.uid(), 'franqueado'::app_role) AND ativo = true);

-- Produtores can view products from their entrada_itens history
CREATE POLICY "Produtores can view products from entrada_itens" 
ON public.produtos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND ativo = true 
  AND EXISTS (
    SELECT 1 FROM public.entrada_itens ei 
    WHERE ei.produto_id = produtos.id 
    AND ei.user_id = auth.uid()
  )
);

-- Admins can view all products
CREATE POLICY "Admins can view all products" 
ON public.produtos 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));