-- Atualizar a política de SELECT para cliente_depositos para permitir
-- que usuários vejam depósitos de clientes vinculados a suas empresas via empresa_clientes

DROP POLICY IF EXISTS "cliente_depositos_select_consolidated" ON public.cliente_depositos;

CREATE POLICY "cliente_depositos_select_consolidated"
ON public.cliente_depositos
FOR SELECT
USING (
  -- Admin pode ver tudo
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR
  -- Usuários podem ver depósitos de clientes onde são cliente_usuarios
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid()
    AND cu.cliente_id = cliente_depositos.cliente_id
    AND cu.ativo = true
  )
  OR
  -- Usuários podem ver depósitos de franquias onde são franquia_usuarios
  EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid()
    AND fu.franquia_id = cliente_depositos.franquia_id
    AND fu.ativo = true
  )
  OR
  -- NOVO: Usuários podem ver depósitos de clientes que estão vinculados às suas empresas
  EXISTS (
    SELECT 1
    FROM empresa_clientes ec
    JOIN cliente_usuarios cu ON cu.cliente_id = ec.empresa_id
    WHERE ec.cliente_id = cliente_depositos.cliente_id
    AND cu.user_id = auth.uid()
    AND cu.ativo = true
    AND ec.ativo = true
  )
);