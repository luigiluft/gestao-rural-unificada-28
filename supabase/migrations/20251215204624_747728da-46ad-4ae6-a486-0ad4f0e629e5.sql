-- 1. Criar função SECURITY DEFINER para verificar acesso por posicao_id
CREATE OR REPLACE FUNCTION public.user_can_view_pallet_position_by_posicao(p_posicao_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    public.get_user_role_direct(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM storage_positions sp
      JOIN franquia_usuarios fu ON fu.franquia_id = sp.deposito_id 
      WHERE sp.id = p_posicao_id
      AND fu.user_id = auth.uid() 
      AND fu.ativo = true
    )
    OR EXISTS (
      SELECT 1 FROM storage_positions sp
      JOIN cliente_depositos cd ON cd.franquia_id = sp.deposito_id
      JOIN cliente_usuarios cu ON cu.cliente_id = cd.cliente_id
      WHERE sp.id = p_posicao_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
  );
$$;

-- 2. Recriar policies com a função
DROP POLICY IF EXISTS pallet_positions_insert_policy ON pallet_positions;
DROP POLICY IF EXISTS pallet_positions_update_policy ON pallet_positions;
DROP POLICY IF EXISTS pallet_positions_delete_policy ON pallet_positions;

CREATE POLICY pallet_positions_insert_v2 ON pallet_positions
FOR INSERT WITH CHECK (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_can_view_pallet_position_by_posicao(posicao_id)
);

CREATE POLICY pallet_positions_update_v2 ON pallet_positions
FOR UPDATE USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_can_view_pallet_position_by_posicao(posicao_id)
);

CREATE POLICY pallet_positions_delete_v2 ON pallet_positions
FOR DELETE USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_can_view_pallet_position_by_posicao(posicao_id)
);