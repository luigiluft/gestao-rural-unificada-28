-- Criar política RLS para permitir produtores atualizarem aprovação de saídas onde são destinatários
CREATE POLICY "Produtores podem aprovar/reprovar saídas onde são destinatários"
ON public.saidas
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND produtor_destinatario_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'produtor'::app_role) 
  AND produtor_destinatario_id = auth.uid()
);