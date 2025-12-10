-- ============================================
-- FASE 4 & 5: Atualizar RLS Policies (corrigido)
-- ============================================

-- 5. delivery_assignments - Corrigir política
-- motoristas.user_id é o dono/criador do motorista (franqueado)
DROP POLICY IF EXISTS "delivery_assignments_all_franquia" ON delivery_assignments;

CREATE POLICY "delivery_assignments_all_franquia" ON delivery_assignments
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM motoristas m
    WHERE m.id = delivery_assignments.motorista_id
    AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM motoristas m
    JOIN franquia_usuarios fu ON fu.user_id = m.user_id
    WHERE m.id = delivery_assignments.motorista_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM motoristas m
    WHERE m.id = delivery_assignments.motorista_id
    AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM motoristas m
    JOIN franquia_usuarios fu ON fu.user_id = m.user_id
    WHERE m.id = delivery_assignments.motorista_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
);

-- 6. Atualizar page_permissions para remover entradas de operador
DELETE FROM page_permissions WHERE role = 'operador';

-- 7. Atualizar user_roles para converter operador em cliente (se houver)
UPDATE user_roles SET role = 'cliente' WHERE role = 'operador';

-- ============================================
-- FASE 5: Preparar B2B - documento_fluxo
-- ============================================

-- Índices para documento_fluxo (B2B)
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_cliente_origem ON documento_fluxo(cliente_origem_id);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_cliente_destino ON documento_fluxo(cliente_destino_id);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_status ON documento_fluxo(status);
CREATE INDEX IF NOT EXISTS idx_documento_fluxo_tipo_fluxo ON documento_fluxo(tipo_fluxo);

-- Índices para contratos_servico (contratos entre empresas)
CREATE INDEX IF NOT EXISTS idx_contratos_servico_franquia ON contratos_servico(franquia_id);
CREATE INDEX IF NOT EXISTS idx_contratos_servico_produtor ON contratos_servico(produtor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_servico_status ON contratos_servico(status);

-- Atualizar RLS do documento_fluxo para suportar B2B entre clientes
DROP POLICY IF EXISTS "documento_fluxo_select" ON documento_fluxo;
DROP POLICY IF EXISTS "documento_fluxo_insert" ON documento_fluxo;
DROP POLICY IF EXISTS "documento_fluxo_update" ON documento_fluxo;

-- Select: usuários podem ver fluxos onde são origem ou destino
CREATE POLICY "documento_fluxo_select" ON documento_fluxo
FOR SELECT USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR user_is_cliente_member(auth.uid(), cliente_origem_id)
  OR user_is_cliente_member(auth.uid(), cliente_destino_id)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid()
    AND fu.franquia_id = documento_fluxo.operador_deposito_id
    AND fu.ativo = true
  )
);

-- Insert: usuários podem criar fluxos de suas empresas
CREATE POLICY "documento_fluxo_insert" ON documento_fluxo
FOR INSERT WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR user_is_cliente_member(auth.uid(), cliente_origem_id)
);

-- Update: origem, destino ou operador podem atualizar
CREATE POLICY "documento_fluxo_update" ON documento_fluxo
FOR UPDATE USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role)
  OR user_is_cliente_member(auth.uid(), cliente_origem_id)
  OR user_is_cliente_member(auth.uid(), cliente_destino_id)
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.user_id = auth.uid()
    AND fu.franquia_id = documento_fluxo.operador_deposito_id
    AND fu.ativo = true
  )
);