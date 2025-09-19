-- Relax RLS role requirement for viewing entries and related data by sub-accounts

-- Entradas: allow any user who is owner OR admin OR belongs to the master franchise hierarchy to view
DROP POLICY IF EXISTS "Franqueados can view entries in their franquia deposits" ON public.entradas;
CREATE POLICY "Franqueados can view entries in their franquia deposits" ON public.entradas
FOR SELECT
USING (
  deposito_id IN (
    SELECT f.id FROM franquias f 
    WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Strict entradas access for business operations" ON public.entradas;
CREATE POLICY "Strict entradas access for business operations" ON public.entradas
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    deposito_id IN (
      SELECT f.id FROM franquias f 
      WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
    )
  )
);

-- Entrada Itens: mirror entradas behavior
DROP POLICY IF EXISTS "Franqueados can view entrada_itens in their franquia" ON public.entrada_itens;
CREATE POLICY "Franqueados can view entrada_itens in their franquia" ON public.entrada_itens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM entradas e JOIN franquias f ON f.id = e.deposito_id
    WHERE e.id = entrada_itens.entrada_id AND 
    (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Strict entrada_itens access for owners and authorized users" ON public.entrada_itens;
CREATE POLICY "Strict entrada_itens access for owners and authorized users" ON public.entrada_itens
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM entradas e JOIN franquias f ON f.id = e.deposito_id
    WHERE e.id = entrada_itens.entrada_id AND 
    (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
    f.ativo = true
  )
);

-- Entrada Status Historico: mirror entradas behavior
DROP POLICY IF EXISTS "Users can view status history of their entries or entries they manage" ON public.entrada_status_historico;
CREATE POLICY "Users can view status history of their entries or entries they manage" ON public.entrada_status_historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_status_historico.entrada_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      e.deposito_id IN (
        SELECT f.id FROM franquias f 
        WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
      )
    )
  )
);
