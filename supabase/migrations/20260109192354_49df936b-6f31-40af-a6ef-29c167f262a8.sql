-- 1. Atualizar profiles com roles legados para 'cliente'
UPDATE public.profiles 
SET role = 'cliente' 
WHERE role IN ('franqueado', 'operador', 'produtor', 'motorista');

-- 2. Atualizar user_roles com roles legados para 'cliente'  
UPDATE public.user_roles 
SET role = 'cliente' 
WHERE role::text IN ('franqueado', 'operador', 'produtor', 'motorista');

-- 3. Remover política RLS legada que usa role 'operador'
DROP POLICY IF EXISTS "Operadores view locais in franquias" ON public.locais_entrega;

-- 4. Recriar política RLS para locais_entrega
-- Agora permite ver locais de clientes vinculados via empresa_clientes
DROP POLICY IF EXISTS "auto_merge_locais_entrega_all_4c9184" ON public.locais_entrega;

CREATE POLICY "locais_entrega_access" ON public.locais_entrega
FOR ALL TO public
USING (
  -- Admins podem ver tudo
  has_role(auth.uid(), 'admin') 
  OR 
  -- Usuários podem ver locais de clientes aos quais estão diretamente vinculados
  cliente_id IN (
    SELECT cu.cliente_id 
    FROM cliente_usuarios cu 
    WHERE cu.user_id = auth.uid() AND cu.ativo = true
  )
  OR
  -- Usuários podem ver locais de clientes que são clientes da sua empresa (via empresa_clientes)
  cliente_id IN (
    SELECT ec.cliente_id
    FROM empresa_clientes ec
    JOIN cliente_usuarios cu ON cu.cliente_id = ec.empresa_id
    WHERE cu.user_id = auth.uid() AND cu.ativo = true AND ec.ativo = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  OR 
  cliente_id IN (
    SELECT cu.cliente_id 
    FROM cliente_usuarios cu 
    WHERE cu.user_id = auth.uid() AND cu.ativo = true
  )
  OR
  cliente_id IN (
    SELECT ec.cliente_id
    FROM empresa_clientes ec
    JOIN cliente_usuarios cu ON cu.cliente_id = ec.empresa_id
    WHERE cu.user_id = auth.uid() AND cu.ativo = true AND ec.ativo = true
  )
);