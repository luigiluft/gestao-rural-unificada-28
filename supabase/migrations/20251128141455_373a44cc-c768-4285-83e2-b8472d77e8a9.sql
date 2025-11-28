-- Adicionar campo para relacionar filiais à empresa matriz
ALTER TABLE public.clientes 
ADD COLUMN empresa_matriz_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE;

-- Adicionar índice para melhor performance
CREATE INDEX idx_clientes_empresa_matriz ON public.clientes(empresa_matriz_id);

-- Comentário explicativo
COMMENT ON COLUMN public.clientes.empresa_matriz_id IS 'ID da empresa matriz quando este registro é uma filial';

-- Atualizar RLS policies para incluir acesso às filiais
-- Usuários que têm acesso à matriz também têm acesso às filiais
DROP POLICY IF EXISTS clientes_select_policy ON public.clientes;

CREATE POLICY clientes_select_policy
ON public.clientes
AS PERMISSIVE
FOR SELECT
TO public
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'
  OR public.user_is_cliente_admin(id, auth.uid())
  OR (empresa_matriz_id IS NOT NULL AND public.user_is_cliente_admin(empresa_matriz_id, auth.uid()))
);