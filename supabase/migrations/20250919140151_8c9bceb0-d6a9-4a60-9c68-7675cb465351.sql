-- Fix remaining RLS policies for sub-accounts to have same visibility as master franchisees

-- Check if storage_positions table exists and update its policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_positions' AND table_schema = 'public') THEN
        -- Update storage_positions policies
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can manage positions in their deposits" ON public.storage_positions';
        EXECUTE 'CREATE POLICY "Franqueados can manage positions in their deposits" ON public.storage_positions
        FOR ALL 
        USING (
          deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
        )
        WITH CHECK (
          deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
        )';
        
        -- Also remove role requirement for viewing
        EXECUTE 'DROP POLICY IF EXISTS "Users can view storage positions" ON public.storage_positions';
        EXECUTE 'CREATE POLICY "Users can view storage positions" ON public.storage_positions
        FOR SELECT 
        USING (
          deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
        )';
    END IF;
END $$;

-- Check if estoque table exists and update its policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'estoque' AND table_schema = 'public') THEN
        -- Update estoque policies
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view estoque in their deposits" ON public.estoque';
        EXECUTE 'CREATE POLICY "Franqueados can view estoque in their deposits" ON public.estoque
        FOR SELECT 
        USING (
          deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
        )';
        
        -- Add broader access policy for sub-accounts
        EXECUTE 'DROP POLICY IF EXISTS "Users can view estoque they manage" ON public.estoque';
        EXECUTE 'CREATE POLICY "Users can view estoque they manage" ON public.estoque
        FOR SELECT 
        USING (
          (auth.uid() = user_id) OR 
          has_role(auth.uid(), ''admin''::app_role) OR 
          deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
        )';
    END IF;
END $$;

-- Update inventarios policies (remove role requirement)
DROP POLICY IF EXISTS "Franqueados can manage inventories in their deposits" ON public.inventarios;
CREATE POLICY "Franqueados can manage inventories in their deposits" ON public.inventarios
FOR ALL 
USING (
  deposito_id IN (
    SELECT franquias.id FROM franquias 
    WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
  )
)
WITH CHECK (
  deposito_id IN (
    SELECT franquias.id FROM franquias 
    WHERE (franquias.master_franqueado_id = auth.uid() OR is_ancestor(franquias.master_franqueado_id, auth.uid()))
  )
);

-- Update franquias policy to be clearer for sub-accounts
DROP POLICY IF EXISTS "Franqueados can view their own franquia" ON public.franquias;
CREATE POLICY "Franqueados can view their own franquia" ON public.franquias
FOR SELECT 
USING (
  (auth.uid() = master_franqueado_id) OR 
  is_ancestor(master_franqueado_id, auth.uid())
);

-- Check if produtos table exists and update its policies for better sub-account access
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produtos' AND table_schema = 'public') THEN
        -- Add policy for franqueados to view all active products (remove role requirement)
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view all active products" ON public.produtos';
        EXECUTE 'CREATE POLICY "Franqueados can view all active products" ON public.produtos
        FOR SELECT 
        USING (
          ativo = true AND (
            (auth.uid() = user_id) OR 
            has_role(auth.uid(), ''admin''::app_role) OR 
            EXISTS (
              SELECT 1 FROM franquias f 
              WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
            )
          )
        )';
    END IF;
END $$;

-- Check if movimentacoes table exists and update its policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimentacoes' AND table_schema = 'public') THEN
        -- Add policy for franqueados to view movements in their deposits
        EXECUTE 'DROP POLICY IF EXISTS "Franqueados can view movements in their deposits" ON public.movimentacoes';
        EXECUTE 'CREATE POLICY "Franqueados can view movements in their deposits" ON public.movimentacoes
        FOR SELECT 
        USING (
          (auth.uid() = user_id) OR 
          has_role(auth.uid(), ''admin''::app_role) OR 
          deposito_id IN (
            SELECT f.id FROM franquias f 
            WHERE (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
        )';
    END IF;
END $$;