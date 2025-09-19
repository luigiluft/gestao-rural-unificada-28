-- Update RLS policies to allow sub-accounts the same access as master franchisees

-- Update divergencias policies
DROP POLICY IF EXISTS "Users can create divergences" ON public.divergencias;
CREATE POLICY "Users can create divergences" ON public.divergencias
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (deposito_id IN (
     SELECT f.id FROM franquias f 
     WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
   )))
);

DROP POLICY IF EXISTS "Users can view divergences they manage" ON public.divergencias;
CREATE POLICY "Users can view divergences they manage" ON public.divergencias
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (deposito_id IN (
     SELECT f.id FROM franquias f 
     WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
   )))
);

DROP POLICY IF EXISTS "Users can update divergences they manage" ON public.divergencias;
CREATE POLICY "Users can update divergences they manage" ON public.divergencias
FOR UPDATE 
USING (
  (user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (deposito_id IN (
     SELECT f.id FROM franquias f 
     WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
   )))
);

-- Update entrada_itens policies
DROP POLICY IF EXISTS "Franqueados can view entrada_itens in their franquia" ON public.entrada_itens;
CREATE POLICY "Franqueados can view entrada_itens in their franquia" ON public.entrada_itens
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  (EXISTS (
    SELECT 1 FROM entradas e JOIN franquias f ON f.id = e.deposito_id
    WHERE e.id = entrada_itens.entrada_id AND 
    (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
  ))
);

DROP POLICY IF EXISTS "Insert own rows or admin/franqueado can insert" ON public.entrada_itens;
CREATE POLICY "Insert own rows or admin/franqueado can insert" ON public.entrada_itens
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (EXISTS (
     SELECT 1 FROM entradas e JOIN franquias f ON f.id = e.deposito_id
     WHERE e.id = entrada_itens.entrada_id AND 
     (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
     f.ativo = true
   )))
);

DROP POLICY IF EXISTS "Strict entrada_itens access for owners and authorized users" ON public.entrada_itens;
CREATE POLICY "Strict entrada_itens access for owners and authorized users" ON public.entrada_itens
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (EXISTS (
     SELECT 1 FROM entradas e JOIN franquias f ON f.id = e.deposito_id
     WHERE e.id = entrada_itens.entrada_id AND 
     (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
     f.ativo = true
   )))
);

-- Update entrada_pallets policies
DROP POLICY IF EXISTS "Users can manage pallets for entries they manage" ON public.entrada_pallets;
CREATE POLICY "Users can manage pallets for entries they manage" ON public.entrada_pallets
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_pallets.entrada_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_pallets.entrada_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

-- Update entrada_pallet_itens policies
DROP POLICY IF EXISTS "Users can manage pallet items for entries they manage" ON public.entrada_pallet_itens;
CREATE POLICY "Users can manage pallet items for entries they manage" ON public.entrada_pallet_itens
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = entrada_pallet_itens.pallet_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = entrada_pallet_itens.pallet_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

-- Update entrada_status_historico policies
DROP POLICY IF EXISTS "Users can view status history of their entries or entries they" ON public.entrada_status_historico;
CREATE POLICY "Users can view status history of their entries or entries they manage" ON public.entrada_status_historico
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_status_historico.entrada_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

DROP POLICY IF EXISTS "Users can insert status history for entries they manage" ON public.entrada_status_historico;
CREATE POLICY "Users can insert status history for entries they manage" ON public.entrada_status_historico
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_status_historico.entrada_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

DROP POLICY IF EXISTS "Users can delete status history for entries they manage" ON public.entrada_status_historico;
CREATE POLICY "Users can delete status history for entries they manage" ON public.entrada_status_historico
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_status_historico.entrada_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

-- Update entradas policies
DROP POLICY IF EXISTS "Franqueados can view entries in their franquia deposits" ON public.entradas;
CREATE POLICY "Franqueados can view entries in their franquia deposits" ON public.entradas
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  (deposito_id IN (
    SELECT f.id FROM franquias f 
    WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
  ))
);

DROP POLICY IF EXISTS "Franqueados can update entries in their franquia" ON public.entradas;
CREATE POLICY "Franqueados can update entries in their franquia" ON public.entradas
FOR UPDATE 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  (deposito_id IN (
    SELECT f.id FROM franquias f 
    WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
  ))
);

DROP POLICY IF EXISTS "Insert own rows or admin/franqueado can insert" ON public.entradas;
CREATE POLICY "Insert own rows or admin/franqueado can insert" ON public.entradas
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (deposito_id IN (
     SELECT f.id FROM franquias f 
     WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
     f.ativo = true
   )))
);

DROP POLICY IF EXISTS "Strict entradas access for business operations" ON public.entradas;
CREATE POLICY "Strict entradas access for business operations" ON public.entradas
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (deposito_id IN (
     SELECT f.id FROM franquias f 
     WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
     f.ativo = true
   )))
);

-- Update estoque_reservas policies
DROP POLICY IF EXISTS "Franqueados can view reservations in their deposits" ON public.estoque_reservas;
CREATE POLICY "Franqueados can view reservations in their deposits" ON public.estoque_reservas
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  (deposito_id IN (
    SELECT f.id FROM franquias f 
    WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
  ))
);

-- Update fazendas policies
DROP POLICY IF EXISTS "Franqueados can view fazendas of their produtores" ON public.fazendas;
CREATE POLICY "Franqueados can view fazendas of their produtores" ON public.fazendas
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM produtores p JOIN franquias f ON f.id = p.franquia_id
    WHERE p.user_id = fazendas.produtor_id AND 
    (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
    f.ativo = true AND p.ativo = true
  )
);

DROP POLICY IF EXISTS "Prevent unauthorized fazendas access" ON public.fazendas;
CREATE POLICY "Prevent unauthorized fazendas access" ON public.fazendas
FOR SELECT 
USING (
  (auth.uid() = produtor_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'franqueado'::app_role) AND 
   (EXISTS (
     SELECT 1 FROM produtores p JOIN franquias f ON f.id = p.franquia_id
     WHERE p.user_id = fazendas.produtor_id AND 
     (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid())) AND 
     f.ativo = true AND p.ativo = true
   )))
);

-- Update pallet_positions policies
DROP POLICY IF EXISTS "Users can manage pallet positions" ON public.pallet_positions;
CREATE POLICY "Users can manage pallet positions" ON public.pallet_positions
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = pallet_positions.pallet_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = pallet_positions.pallet_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

DROP POLICY IF EXISTS "Users can view pallet positions" ON public.pallet_positions;
CREATE POLICY "Users can view pallet positions" ON public.pallet_positions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = pallet_positions.pallet_id AND (
      (e.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       e.deposito_id IN (
         SELECT f.id FROM franquias f 
         WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
       ))
    )
  )
);