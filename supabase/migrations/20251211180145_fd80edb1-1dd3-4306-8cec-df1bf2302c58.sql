-- Drop existing policy
DROP POLICY IF EXISTS "storage_positions_all_consolidated" ON public.storage_positions;

-- Create new consolidated policy that also allows clients to manage positions for their deposits
CREATE POLICY "storage_positions_all_consolidated" ON public.storage_positions
FOR ALL
USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR user_belongs_to_franquia(auth.uid(), deposito_id)
  OR EXISTS (
    SELECT 1 FROM cliente_depositos cd
    WHERE cd.franquia_id = storage_positions.deposito_id
    AND cd.ativo = true
    AND EXISTS (
      SELECT 1 FROM cliente_usuarios cu
      WHERE cu.cliente_id = cd.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
  )
)
WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR user_belongs_to_franquia(auth.uid(), deposito_id)
  OR EXISTS (
    SELECT 1 FROM cliente_depositos cd
    WHERE cd.franquia_id = storage_positions.deposito_id
    AND cd.ativo = true
    AND EXISTS (
      SELECT 1 FROM cliente_usuarios cu
      WHERE cu.cliente_id = cd.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
  )
);