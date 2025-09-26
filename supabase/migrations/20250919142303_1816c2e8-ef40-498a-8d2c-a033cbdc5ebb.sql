-- Grant SELECT visibility by franchise hierarchy for pallets and positions to subaccounts as well

-- entrada_pallets: add SELECT policy for franchise hierarchy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'entrada_pallets' AND policyname = 'View pallets by franchise hierarchy'
  ) THEN
    CREATE POLICY "View pallets by franchise hierarchy"
    ON public.entrada_pallets
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 
        FROM entradas e
        JOIN franquias f ON f.id = e.deposito_id
        WHERE e.id = entrada_pallets.entrada_id
          AND (
            e.user_id = auth.uid()
            OR has_role(auth.uid(), 'admin'::app_role)
            OR (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
      )
    );
  END IF;
END $$;

-- entrada_pallet_itens: add SELECT policy for franchise hierarchy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'entrada_pallet_itens' AND policyname = 'View pallet items by franchise hierarchy'
  ) THEN
    CREATE POLICY "View pallet items by franchise hierarchy"
    ON public.entrada_pallet_itens
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 
        FROM entrada_pallets ep
        JOIN entradas e ON e.id = ep.entrada_id
        JOIN franquias f ON f.id = e.deposito_id
        WHERE ep.id = entrada_pallet_itens.pallet_id
          AND (
            e.user_id = auth.uid()
            OR has_role(auth.uid(), 'admin'::app_role)
            OR (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
      )
    );
  END IF;
END $$;

-- pallet_positions: add SELECT policy for franchise hierarchy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pallet_positions' AND policyname = 'View pallet positions by franchise hierarchy'
  ) THEN
    CREATE POLICY "View pallet positions by franchise hierarchy"
    ON public.pallet_positions
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 
        FROM entrada_pallets ep
        JOIN entradas e ON e.id = ep.entrada_id
        JOIN franquias f ON f.id = e.deposito_id
        WHERE ep.id = pallet_positions.pallet_id
          AND (
            e.user_id = auth.uid()
            OR has_role(auth.uid(), 'admin'::app_role)
            OR (f.master_franqueado_id = auth.uid() OR is_ancestor(f.master_franqueado_id, auth.uid()))
          )
      )
    );
  END IF;
END $$;