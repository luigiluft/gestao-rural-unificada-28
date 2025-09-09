-- Verificar e corrigir política RLS para saida_itens
-- Produtores devem poder ver itens de saídas onde são destinatários

-- Verificar política atual
-- Se não existe, criar nova política
CREATE POLICY IF NOT EXISTS "Produtores can view saida_itens for their saidas" 
ON public.saida_itens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.saidas s 
    WHERE s.id = saida_itens.saida_id 
    AND (
      s.user_id = auth.uid() OR  -- Criador da saída pode ver
      s.produtor_destinatario_id = auth.uid()  -- Destinatário pode ver
    )
  )
);