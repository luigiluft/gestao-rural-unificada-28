-- Drop the existing SELECT policy that doesn't include cliente access
DROP POLICY IF EXISTS "pallet_positions_select_consolidated" ON public.pallet_positions;

-- Create a new SELECT policy that includes both franquia_usuarios AND cliente_usuarios access
CREATE POLICY "pallet_positions_select_consolidated" ON public.pallet_positions
FOR SELECT USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR (
    -- Franqueado/Operador access via franquia_usuarios
    EXISTS (
      SELECT 1
      FROM entrada_pallets ep
      JOIN entradas e ON e.id = ep.entrada_id
      JOIN franquia_usuarios fu ON fu.franquia_id = e.deposito_id
      WHERE ep.id = pallet_positions.pallet_id 
        AND fu.user_id = auth.uid() 
        AND fu.ativo = true
    )
  )
  OR (
    -- Cliente access via cliente_usuarios (for their own entries)
    EXISTS (
      SELECT 1
      FROM entrada_pallets ep
      JOIN entradas e ON e.id = ep.entrada_id
      JOIN cliente_depositos cd ON cd.franquia_id = e.deposito_id
      JOIN cliente_usuarios cu ON cu.cliente_id = cd.cliente_id
      WHERE ep.id = pallet_positions.pallet_id 
        AND cu.user_id = auth.uid() 
        AND cu.ativo = true
    )
  )
  OR (
    -- Cliente access via entry ownership
    EXISTS (
      SELECT 1
      FROM entrada_pallets ep
      JOIN entradas e ON e.id = ep.entrada_id
      WHERE ep.id = pallet_positions.pallet_id 
        AND e.user_id = auth.uid()
    )
  )
);