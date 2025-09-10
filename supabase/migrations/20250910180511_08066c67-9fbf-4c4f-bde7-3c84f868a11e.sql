-- Criar uma view regular com RLS baseada na view materializada
CREATE VIEW public.estoque_seguro AS
SELECT * FROM public.estoque;

-- Habilitar RLS na view regular
ALTER VIEW public.estoque_seguro ENABLE ROW LEVEL SECURITY;

-- Política para produtores - só veem seu próprio estoque
CREATE POLICY "Produtores podem ver apenas seu próprio estoque"
ON public.estoque_seguro
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para admins - podem ver tudo
CREATE POLICY "Admins podem ver todo o estoque"
ON public.estoque_seguro
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para franqueados - podem ver estoque dos produtores da sua franquia
CREATE POLICY "Franqueados podem ver estoque dos produtores da sua franquia"
ON public.estoque_seguro
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND (
    deposito_id IN (
      SELECT f.id 
      FROM franquias f 
      WHERE f.master_franqueado_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 
      FROM user_hierarchy uh
      WHERE uh.child_user_id = user_id 
      AND uh.parent_user_id = auth.uid()
    )
  )
);