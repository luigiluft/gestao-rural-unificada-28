-- Remove a política problemática existente
DROP POLICY IF EXISTS "Produtores can view products from their entradas and saidas" ON public.produtos;

-- Criar uma política mais simples e robusta para produtores
CREATE POLICY "Produtores can view all active products" 
ON public.produtos
FOR SELECT
USING (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND ativo = true
);

-- Política separada para verificar se o produtor pode ver produtos específicos das saídas
-- (Será controlada pela política da tabela saida_itens)