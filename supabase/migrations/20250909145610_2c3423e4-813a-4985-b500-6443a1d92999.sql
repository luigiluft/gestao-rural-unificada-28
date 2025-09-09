-- Remover política restritiva para produtores
DROP POLICY IF EXISTS "Produtores can view products from entrada_itens" ON public.produtos;

-- Criar política mais abrangente que permite produtores verem produtos de suas entradas E saídas
CREATE POLICY "Produtores can view products from their entradas and saidas" 
ON public.produtos
FOR SELECT
USING (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND ativo = true 
  AND (
    -- Pode ver produtos de suas próprias entradas
    EXISTS (
      SELECT 1
      FROM entrada_itens ei
      WHERE ei.produto_id = produtos.id 
      AND ei.user_id = auth.uid()
    )
    OR
    -- Pode ver produtos de suas próprias saídas
    EXISTS (
      SELECT 1
      FROM saida_itens si
      JOIN saidas s ON s.id = si.saida_id
      WHERE si.produto_id = produtos.id 
      AND s.user_id = auth.uid()
    )
    OR
    -- Pode ver produtos de saídas destinadas a ele
    EXISTS (
      SELECT 1
      FROM saida_itens si
      JOIN saidas s ON s.id = si.saida_id
      WHERE si.produto_id = produtos.id 
      AND s.produtor_destinatario_id = auth.uid()
    )
  )
);