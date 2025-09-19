-- Complete RLS policies update for sub-accounts (Part 2)

-- Fix the duplicate policy by dropping with the original name
DROP POLICY IF EXISTS "Users can view status history of their entries or entries they" ON public.entrada_status_historico;

-- Continue with remaining table updates

-- Update inventarios policies
DROP POLICY IF EXISTS "Franqueados can manage inventories in their deposits" ON public.inventarios;
CREATE POLICY "Franqueados can manage inventories in their deposits" ON public.inventarios
FOR ALL 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  (deposito_id IN (
    SELECT franquias.id FROM franquias 
    WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  (deposito_id IN (
    SELECT franquias.id FROM franquias 
    WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
  ))
);

-- Update inventario_itens policies
DROP POLICY IF EXISTS "Users can manage items for their inventories" ON public.inventario_itens;
CREATE POLICY "Users can manage items for their inventories" ON public.inventario_itens
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM inventarios i
    WHERE i.id = inventario_itens.inventario_id AND (
      (i.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       i.deposito_id IN (
         SELECT franquias.id FROM franquias 
         WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
       ))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inventarios i
    WHERE i.id = inventario_itens.inventario_id AND (
      (i.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       i.deposito_id IN (
         SELECT franquias.id FROM franquias 
         WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

-- Update inventario_posicoes policies
DROP POLICY IF EXISTS "Users can manage positions for their inventories" ON public.inventario_posicoes;
CREATE POLICY "Users can manage positions for their inventories" ON public.inventario_posicoes
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM inventarios i
    WHERE i.id = inventario_posicoes.inventario_id AND (
      (i.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       i.deposito_id IN (
         SELECT franquias.id FROM franquias 
         WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
       ))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inventarios i
    WHERE i.id = inventario_posicoes.inventario_id AND (
      (i.user_id = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (has_role(auth.uid(), 'franqueado'::app_role) AND 
       i.deposito_id IN (
         SELECT franquias.id FROM franquias 
         WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
       ))
    )
  )
);

-- Check if produtores table exists and update its policies if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produtores' AND table_schema = 'public') THEN
        -- Update produtores policies if the table exists
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view produtores in their franquia" ON public.produtores';
        EXECUTE 'CREATE POLICY "Franqueados can view produtores in their franquia" ON public.produtores
        FOR SELECT 
        USING (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (franquia_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )';
        
        EXECUTE 'DROP POLICY IF EXISTS "Prevent unauthorized produtores access" ON public.produtores';
        EXECUTE 'CREATE POLICY "Prevent unauthorized produtores access" ON public.produtores
        FOR SELECT 
        USING (
          (auth.uid() = user_id) OR 
          has_role(auth.uid(), ''admin''::app_role) OR 
          (has_role(auth.uid(), ''franqueado''::app_role) AND 
           (franquia_id IN (
             SELECT f.id FROM franquias f 
             WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
           )))
        )';
    END IF;
END $$;

-- Check if storage_positions table exists and update its policies if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_positions' AND table_schema = 'public') THEN
        -- Update storage_positions policies if the table exists
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can manage positions in their deposits" ON public.storage_positions';
        EXECUTE 'CREATE POLICY "Franqueados can manage positions in their deposits" ON public.storage_positions
        FOR ALL 
        USING (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )
        WITH CHECK (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )';
    END IF;
END $$;

-- Check if estoque table exists and update its policies if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'estoque' AND table_schema = 'public') THEN
        -- Update estoque policies if the table exists
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view estoque in their deposits" ON public.estoque';
        EXECUTE 'CREATE POLICY "Franqueados can view estoque in their deposits" ON public.estoque
        FOR SELECT 
        USING (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )';
    END IF;
END $$;

-- Check if saidas table exists and update its policies if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saidas' AND table_schema = 'public') THEN
        -- Update saidas policies if the table exists
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view saidas in their deposits" ON public.saidas';
        EXECUTE 'CREATE POLICY "Franqueados can view saidas in their deposits" ON public.saidas
        FOR SELECT 
        USING (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )';
        
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can manage saidas in their deposits" ON public.saidas';
        EXECUTE 'CREATE POLICY "Franqueados can manage saidas in their deposits" ON public.saidas
        FOR ALL 
        USING (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )
        WITH CHECK (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )';
    END IF;
END $$;

-- Check if saida_itens table exists and update its policies if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saida_itens' AND table_schema = 'public') THEN
        -- Update saida_itens policies if the table exists
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view saida_itens in their deposits" ON public.saida_itens';
        EXECUTE 'CREATE POLICY "Franqueados can view saida_itens in their deposits" ON public.saida_itens
        FOR SELECT 
        USING (
          has_role(auth.uid(), ''franqueado''::app_role) AND 
          (EXISTS (
            SELECT 1 FROM saidas s JOIN franquias f ON f.id = s.deposito_id
            WHERE s.id = saida_itens.saida_id AND 
            (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          ))
        )';
    END IF;
END $$;