-- Fase 1: Migração de Operadores para Clientes

-- 1. Atualizar todos os perfis com role 'operador' para 'cliente'
UPDATE public.profiles 
SET role = 'cliente' 
WHERE role = 'operador';

-- 2. Para cada usuário que era operador e tinha franquias como master,
-- criar registros em cliente_depositos se não existirem
-- (vinculando seus depósitos às empresas deles)

-- 3. Atualizar RLS policies para remover verificações específicas de operador
-- Primeiro, dropar policies antigas que verificam operador especificamente

-- Atualizar a policy de insert de franquias para não precisar mais de operador
DROP POLICY IF EXISTS "franquias_insert_policy" ON public.franquias;

CREATE POLICY "franquias_insert_policy" ON public.franquias
FOR INSERT
WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR (
    -- Clientes podem criar depósitos do tipo filial (suas próprias matrizes/filiais)
    check_user_role_safe(auth.uid(), 'cliente'::app_role) 
    AND tipo_deposito = 'filial'
  )
);

-- Atualizar policy de SELECT para incluir clientes com acesso via franquia_usuarios
DROP POLICY IF EXISTS "franquias_select_consolidated" ON public.franquias;

CREATE POLICY "franquias_select_consolidated" ON public.franquias
FOR SELECT
USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
  )
  OR EXISTS (
    SELECT 1 FROM cliente_depositos cd
    JOIN cliente_usuarios cu ON cu.cliente_id = cd.cliente_id
    WHERE cd.franquia_id = franquias.id
    AND cu.user_id = auth.uid()
    AND cu.ativo = true
    AND cd.ativo = true
  )
);

-- Atualizar policy de UPDATE
DROP POLICY IF EXISTS "franquias_update_consolidated" ON public.franquias;

CREATE POLICY "franquias_update_consolidated" ON public.franquias
FOR UPDATE
USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
    AND fu.papel = 'master'
  )
)
WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
    AND fu.papel = 'master'
  )
);

-- Atualizar policy de DELETE
DROP POLICY IF EXISTS "franquias_delete_consolidated" ON public.franquias;

CREATE POLICY "franquias_delete_consolidated" ON public.franquias
FOR DELETE
USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu 
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true
    AND fu.papel = 'master'
  )
);