-- Tighten SELECT policies to enforce granular view access
-- Estoque
DROP POLICY IF EXISTS "Select visible rows by hierarchy" ON public.estoque;
DROP POLICY IF EXISTS "Owner or admin can select" ON public.estoque;
DROP POLICY IF EXISTS "Ancestors with estoque.view/manage can select" ON public.estoque;
CREATE POLICY "Owner or admin can select"
ON public.estoque
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ancestors with estoque.view/manage can select"
ON public.estoque
FOR SELECT
USING (
  public.is_ancestor(auth.uid(), user_id)
  AND (
    public.has_permission(auth.uid(), 'estoque.view')
    OR public.has_permission(auth.uid(), 'estoque.manage')
  )
);

-- Entradas
DROP POLICY IF EXISTS "Select visible rows by hierarchy" ON public.entradas;
DROP POLICY IF EXISTS "Owner or admin can select" ON public.entradas;
DROP POLICY IF EXISTS "Ancestors with entradas.manage can select" ON public.entradas;
CREATE POLICY "Owner or admin can select"
ON public.entradas
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ancestors with entradas.manage can select"
ON public.entradas
FOR SELECT
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

-- Saidas
DROP POLICY IF EXISTS "Select visible rows by hierarchy" ON public.saidas;
DROP POLICY IF EXISTS "Owner or admin can select" ON public.saidas;
DROP POLICY IF EXISTS "Ancestors with saidas.manage can select" ON public.saidas;
CREATE POLICY "Owner or admin can select"
ON public.saidas
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ancestors with saidas.manage can select"
ON public.saidas
FOR SELECT
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));

-- entrada_itens
DROP POLICY IF EXISTS "Select visible rows by hierarchy" ON public.entrada_itens;
DROP POLICY IF EXISTS "Owner or admin can select" ON public.entrada_itens;
DROP POLICY IF EXISTS "Ancestors with entradas.manage can select itens" ON public.entrada_itens;
CREATE POLICY "Owner or admin can select"
ON public.entrada_itens
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ancestors with entradas.manage can select itens"
ON public.entrada_itens
FOR SELECT
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

-- saida_itens
DROP POLICY IF EXISTS "Select visible rows by hierarchy" ON public.saida_itens;
DROP POLICY IF EXISTS "Owner or admin can select" ON public.saida_itens;
DROP POLICY IF EXISTS "Ancestors with saidas.manage can select itens" ON public.saida_itens;
CREATE POLICY "Owner or admin can select"
ON public.saida_itens
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ancestors with saidas.manage can select itens"
ON public.saida_itens
FOR SELECT
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));
