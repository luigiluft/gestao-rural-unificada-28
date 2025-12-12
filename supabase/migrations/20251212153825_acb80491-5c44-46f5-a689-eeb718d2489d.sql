-- Fase 1: Estrutura de Banco de Dados

-- 1.1 Adicionar coluna cliente_id na tabela tabelas_frete
ALTER TABLE public.tabelas_frete ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE;

-- 1.2 Adicionar coluna publica para permitir compartilhamento
ALTER TABLE public.tabelas_frete ADD COLUMN IF NOT EXISTS publica boolean DEFAULT false;

-- 1.3 Adicionar coluna cliente_id na tabela transportadoras
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Fase 2: Atualizar RLS Policies

-- 2.1 RLS para tabelas_frete
DROP POLICY IF EXISTS "tabelas_frete_select_consolidated" ON public.tabelas_frete;
DROP POLICY IF EXISTS "tabelas_frete_insert_consolidated" ON public.tabelas_frete;
DROP POLICY IF EXISTS "tabelas_frete_update_consolidated" ON public.tabelas_frete;
DROP POLICY IF EXISTS "tabelas_frete_delete_consolidated" ON public.tabelas_frete;

CREATE POLICY "tabelas_frete_select_consolidated" ON public.tabelas_frete
FOR SELECT USING (
  check_user_role_safe(auth.uid(), 'admin') OR
  -- Franqueados vêem suas tabelas (mantém funcionalidade existente)
  EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.franquia_id = tabelas_frete.franqueado_id AND fu.ativo = true
  ) OR
  -- Cliente vê suas próprias tabelas
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = tabelas_frete.cliente_id AND cu.ativo = true
  ) OR
  -- Qualquer um vê tabelas públicas
  (publica = true AND ativo = true)
);

CREATE POLICY "tabelas_frete_insert_consolidated" ON public.tabelas_frete
FOR INSERT WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.franquia_id = tabelas_frete.franqueado_id AND fu.ativo = true
  ) OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = tabelas_frete.cliente_id AND cu.ativo = true
  )
);

CREATE POLICY "tabelas_frete_update_consolidated" ON public.tabelas_frete
FOR UPDATE USING (
  check_user_role_safe(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.franquia_id = tabelas_frete.franqueado_id AND fu.ativo = true
  ) OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = tabelas_frete.cliente_id AND cu.ativo = true
  )
);

CREATE POLICY "tabelas_frete_delete_consolidated" ON public.tabelas_frete
FOR DELETE USING (
  check_user_role_safe(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.franquia_id = tabelas_frete.franqueado_id AND fu.ativo = true
  ) OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = tabelas_frete.cliente_id AND cu.ativo = true
  )
);

-- 2.2 RLS para transportadoras
DROP POLICY IF EXISTS "transportadoras_select_consolidated" ON public.transportadoras;
DROP POLICY IF EXISTS "transportadoras_insert_consolidated" ON public.transportadoras;
DROP POLICY IF EXISTS "transportadoras_update_consolidated" ON public.transportadoras;
DROP POLICY IF EXISTS "transportadoras_delete_consolidated" ON public.transportadoras;

CREATE POLICY "transportadoras_select_consolidated" ON public.transportadoras
FOR SELECT USING (
  check_user_role_safe(auth.uid(), 'admin') OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = transportadoras.cliente_id AND cu.ativo = true
  )
);

CREATE POLICY "transportadoras_insert_consolidated" ON public.transportadoras
FOR INSERT WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin') OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = transportadoras.cliente_id AND cu.ativo = true
  )
);

CREATE POLICY "transportadoras_update_consolidated" ON public.transportadoras
FOR UPDATE USING (
  check_user_role_safe(auth.uid(), 'admin') OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = transportadoras.cliente_id AND cu.ativo = true
  )
);

CREATE POLICY "transportadoras_delete_consolidated" ON public.transportadoras
FOR DELETE USING (
  check_user_role_safe(auth.uid(), 'admin') OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.cliente_id = transportadoras.cliente_id AND cu.ativo = true
  )
);

-- 2.3 RLS para frete_faixas (herdar de tabelas_frete)
DROP POLICY IF EXISTS "frete_faixas_select_consolidated" ON public.frete_faixas;
DROP POLICY IF EXISTS "frete_faixas_insert_consolidated" ON public.frete_faixas;
DROP POLICY IF EXISTS "frete_faixas_update_consolidated" ON public.frete_faixas;
DROP POLICY IF EXISTS "frete_faixas_delete_consolidated" ON public.frete_faixas;

CREATE POLICY "frete_faixas_select_consolidated" ON public.frete_faixas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tabelas_frete tf
    WHERE tf.id = frete_faixas.tabela_frete_id
    AND (
      check_user_role_safe(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM franquia_usuarios fu WHERE fu.user_id = auth.uid() AND fu.franquia_id = tf.franqueado_id AND fu.ativo = true) OR
      EXISTS (SELECT 1 FROM cliente_usuarios cu WHERE cu.user_id = auth.uid() AND cu.cliente_id = tf.cliente_id AND cu.ativo = true) OR
      (tf.publica = true AND tf.ativo = true)
    )
  )
);

CREATE POLICY "frete_faixas_insert_consolidated" ON public.frete_faixas
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tabelas_frete tf
    WHERE tf.id = frete_faixas.tabela_frete_id
    AND (
      check_user_role_safe(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM franquia_usuarios fu WHERE fu.user_id = auth.uid() AND fu.franquia_id = tf.franqueado_id AND fu.ativo = true) OR
      EXISTS (SELECT 1 FROM cliente_usuarios cu WHERE cu.user_id = auth.uid() AND cu.cliente_id = tf.cliente_id AND cu.ativo = true)
    )
  )
);

CREATE POLICY "frete_faixas_update_consolidated" ON public.frete_faixas
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tabelas_frete tf
    WHERE tf.id = frete_faixas.tabela_frete_id
    AND (
      check_user_role_safe(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM franquia_usuarios fu WHERE fu.user_id = auth.uid() AND fu.franquia_id = tf.franqueado_id AND fu.ativo = true) OR
      EXISTS (SELECT 1 FROM cliente_usuarios cu WHERE cu.user_id = auth.uid() AND cu.cliente_id = tf.cliente_id AND cu.ativo = true)
    )
  )
);

CREATE POLICY "frete_faixas_delete_consolidated" ON public.frete_faixas
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tabelas_frete tf
    WHERE tf.id = frete_faixas.tabela_frete_id
    AND (
      check_user_role_safe(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM franquia_usuarios fu WHERE fu.user_id = auth.uid() AND fu.franquia_id = tf.franqueado_id AND fu.ativo = true) OR
      EXISTS (SELECT 1 FROM cliente_usuarios cu WHERE cu.user_id = auth.uid() AND cu.cliente_id = tf.cliente_id AND cu.ativo = true)
    )
  )
);

-- Fase 3: Permissões de Página
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
('tabelas-frete', 'cliente', true, true),
('tabela-frete', 'cliente', true, true),
('transportadoras', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET can_access = true, visible_in_menu = true;

-- Fase 6: RPC Functions para busca de transportadora na plataforma
CREATE OR REPLACE FUNCTION public.buscar_transportadora_plataforma(p_cnpj text)
RETURNS TABLE (
  cliente_id uuid,
  razao_social text,
  cnpj text,
  tem_tabelas_frete boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.razao_social,
    c.cpf_cnpj,
    EXISTS(SELECT 1 FROM tabelas_frete tf WHERE tf.cliente_id = c.id AND tf.publica = true AND tf.ativo = true)
  FROM clientes c
  WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') = REPLACE(REPLACE(REPLACE(p_cnpj, '.', ''), '-', ''), '/', '')
  AND c.ativo = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.buscar_tabelas_transportadora(p_cliente_id uuid)
RETURNS SETOF tabelas_frete
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM tabelas_frete
  WHERE cliente_id = p_cliente_id
  AND publica = true
  AND ativo = true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.buscar_transportadora_plataforma(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_tabelas_transportadora(uuid) TO authenticated;