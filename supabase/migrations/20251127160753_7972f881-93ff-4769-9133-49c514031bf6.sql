-- Consolidação de Políticas RLS - Tabelas Críticas e Médias (Corrigido)
-- IMPORTANTE: Esta migration consolida políticas duplicadas mantendo a MESMA funcionalidade

-- ============================================================================
-- TABELA: viagens (6 políticas SELECT → 1 consolidada)
-- ============================================================================

-- DROP políticas SELECT duplicadas
DROP POLICY IF EXISTS "Admins can manage all viagens" ON public.viagens;
DROP POLICY IF EXISTS "Drivers can view assigned viagens" ON public.viagens;
DROP POLICY IF EXISTS "Franqueados can manage own viagens" ON public.viagens;
DROP POLICY IF EXISTS "Franqueados can view viagens by franchise relation" ON public.viagens;
DROP POLICY IF EXISTS "Users can manage their own viagens" ON public.viagens;
DROP POLICY IF EXISTS "Users can view viagens in their franchise" ON public.viagens;

-- CREATE política SELECT consolidada
CREATE POLICY "viagens_select_consolidated" ON public.viagens
FOR SELECT
USING (
  -- Admins podem ver todas as viagens
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Motoristas podem ver viagens atribuídas a eles
  EXISTS (
    SELECT 1 FROM public.motoristas m
    WHERE m.auth_user_id = auth.uid() AND m.id = viagens.motorista_id
  )
  OR
  -- Franqueados/Operadores podem ver viagens de suas franquias
  EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() 
    AND fu.franquia_id = viagens.deposito_id 
    AND fu.ativo = true
  )
  OR
  -- Usuários podem ver viagens que criaram
  viagens.user_id = auth.uid()
);

-- DROP políticas INSERT duplicadas
DROP POLICY IF EXISTS "Users can create viagens in their franchise" ON public.viagens;

-- CREATE política INSERT consolidada
CREATE POLICY "viagens_insert_consolidated" ON public.viagens
FOR INSERT
WITH CHECK (
  -- Admins podem criar qualquer viagem
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Franqueados podem criar viagens em suas franquias
  EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() 
    AND fu.franquia_id = viagens.deposito_id 
    AND fu.ativo = true
  )
  OR
  -- Usuários podem criar viagens próprias
  viagens.user_id = auth.uid()
);

-- DROP políticas UPDATE duplicadas
DROP POLICY IF EXISTS "Drivers can update assigned viagens" ON public.viagens;
DROP POLICY IF EXISTS "Users can update viagens they manage" ON public.viagens;

-- CREATE política UPDATE consolidada
CREATE POLICY "viagens_update_consolidated" ON public.viagens
FOR UPDATE
USING (
  -- Admins podem atualizar qualquer viagem
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Motoristas podem atualizar viagens atribuídas
  EXISTS (
    SELECT 1 FROM public.motoristas m
    WHERE m.auth_user_id = auth.uid() AND m.id = viagens.motorista_id
  )
  OR
  -- Franqueados podem atualizar viagens de suas franquias
  EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() 
    AND fu.franquia_id = viagens.deposito_id 
    AND fu.ativo = true
  )
  OR
  -- Usuários podem atualizar suas próprias viagens
  viagens.user_id = auth.uid()
);

-- DROP políticas DELETE duplicadas
DROP POLICY IF EXISTS "Users can delete viagens they manage" ON public.viagens;

-- CREATE política DELETE consolidada
CREATE POLICY "viagens_delete_consolidated" ON public.viagens
FOR DELETE
USING (
  -- Admins podem deletar qualquer viagem
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Franqueados podem deletar viagens de suas franquias
  EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() 
    AND fu.franquia_id = viagens.deposito_id 
    AND fu.ativo = true
  )
  OR
  -- Usuários podem deletar suas próprias viagens
  viagens.user_id = auth.uid()
);

-- ============================================================================
-- TABELA: cliente_depositos (4 políticas SELECT → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "admin_all_depositos" ON public.cliente_depositos;
DROP POLICY IF EXISTS "clientes_manage_own_depositos" ON public.cliente_depositos;
DROP POLICY IF EXISTS "clientes_view_own_depositos" ON public.cliente_depositos;
DROP POLICY IF EXISTS "franqueados_view_depositos_in_franquia" ON public.cliente_depositos;

CREATE POLICY "cliente_depositos_select_consolidated" ON public.cliente_depositos
FOR SELECT
USING (
  -- Admins podem ver todos os depósitos
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Clientes podem ver seus próprios depósitos
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_depositos.cliente_id 
    AND cu.ativo = true
  )
  OR
  -- Franqueados podem ver depósitos em suas franquias
  EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() 
    AND fu.franquia_id = cliente_depositos.franquia_id 
    AND fu.ativo = true
  )
);

-- Consolidar INSERT/UPDATE/DELETE também
CREATE POLICY "cliente_depositos_insert_consolidated" ON public.cliente_depositos
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_depositos.cliente_id 
    AND cu.ativo = true
  )
);

CREATE POLICY "cliente_depositos_update_consolidated" ON public.cliente_depositos
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_depositos.cliente_id 
    AND cu.ativo = true
  )
);

CREATE POLICY "cliente_depositos_delete_consolidated" ON public.cliente_depositos
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_depositos.cliente_id 
    AND cu.ativo = true
  )
);

-- ============================================================================
-- TABELA: cliente_usuarios (4 políticas SELECT → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all cliente_usuarios" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Client admins can manage cliente_usuarios" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Users can view their cliente associations" ON public.cliente_usuarios;
DROP POLICY IF EXISTS "Users can view their own cliente_usuarios" ON public.cliente_usuarios;

CREATE POLICY "cliente_usuarios_select_consolidated" ON public.cliente_usuarios
FOR SELECT
USING (
  -- Admins podem ver todos
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Usuários podem ver suas próprias associações
  cliente_usuarios.user_id = auth.uid()
  OR
  -- Client admins podem ver associações de seus clientes
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  )
);

-- Consolidar outras operações
DROP POLICY IF EXISTS "Users can insert cliente associations" ON public.cliente_usuarios;

CREATE POLICY "cliente_usuarios_insert_consolidated" ON public.cliente_usuarios
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  cliente_usuarios.user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  )
);

DROP POLICY IF EXISTS "Users can update their cliente associations" ON public.cliente_usuarios;

CREATE POLICY "cliente_usuarios_update_consolidated" ON public.cliente_usuarios
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  cliente_usuarios.user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  )
);

DROP POLICY IF EXISTS "Users can delete their cliente associations" ON public.cliente_usuarios;

CREATE POLICY "cliente_usuarios_delete_consolidated" ON public.cliente_usuarios
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  cliente_usuarios.user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() 
    AND cu.cliente_id = cliente_usuarios.cliente_id 
    AND cu.ativo = true
  )
);

-- ============================================================================
-- TABELA: contrato_franquia (4 políticas SELECT → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all contrato_franquia" ON public.contrato_franquia;
DROP POLICY IF EXISTS "Admins podem visualizar todos os contratos de franquia" ON public.contrato_franquia;
DROP POLICY IF EXISTS "Franqueados can view their own contrato_franquia" ON public.contrato_franquia;
DROP POLICY IF EXISTS "Franqueados podem visualizar seus próprios contratos" ON public.contrato_franquia;

CREATE POLICY "contrato_franquia_select_consolidated" ON public.contrato_franquia
FOR SELECT
USING (
  -- Admins podem ver todos os contratos
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Franqueados podem ver contratos de suas franquias
  EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() 
    AND fu.franquia_id = contrato_franquia.franquia_id 
    AND fu.ativo = true
  )
);

-- Consolidar outras operações
DROP POLICY IF EXISTS "Admins podem criar contratos de franquia" ON public.contrato_franquia;

CREATE POLICY "contrato_franquia_insert_consolidated" ON public.contrato_franquia
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins podem atualizar contratos de franquia" ON public.contrato_franquia;

CREATE POLICY "contrato_franquia_update_consolidated" ON public.contrato_franquia
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins podem deletar contratos de franquia" ON public.contrato_franquia;

CREATE POLICY "contrato_franquia_delete_consolidated" ON public.contrato_franquia
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
);

-- ============================================================================
-- TABELA: contrato_janelas_entrega (4 políticas SELECT → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "Admins podem ver todas as janelas" ON public.contrato_janelas_entrega;
DROP POLICY IF EXISTS "Franqueados podem ver janelas de seus contratos" ON public.contrato_janelas_entrega;
DROP POLICY IF EXISTS "Produtores podem ver janelas de seus contratos" ON public.contrato_janelas_entrega;
DROP POLICY IF EXISTS "Users manage delivery windows via contract access" ON public.contrato_janelas_entrega;

CREATE POLICY "contrato_janelas_select_consolidated" ON public.contrato_janelas_entrega
FOR SELECT
USING (
  -- Admins podem ver todas as janelas
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Franqueados podem ver janelas de contratos de suas franquias
  EXISTS (
    SELECT 1 FROM public.contratos_servico cs
    INNER JOIN public.franquia_usuarios fu ON fu.franquia_id = cs.franquia_id
    WHERE cs.id = contrato_janelas_entrega.contrato_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
  OR
  -- Clientes podem ver janelas de seus contratos
  EXISTS (
    SELECT 1 FROM public.contratos_servico cs
    INNER JOIN public.cliente_usuarios cu ON cu.cliente_id = cs.produtor_id
    WHERE cs.id = contrato_janelas_entrega.contrato_id
    AND cu.user_id = auth.uid()
    AND cu.ativo = true
  )
);

-- Consolidar outras operações
DROP POLICY IF EXISTS "Admins e franqueados podem inserir janelas" ON public.contrato_janelas_entrega;

CREATE POLICY "contrato_janelas_insert_consolidated" ON public.contrato_janelas_entrega
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.contratos_servico cs
    INNER JOIN public.franquia_usuarios fu ON fu.franquia_id = cs.franquia_id
    WHERE cs.id = contrato_janelas_entrega.contrato_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
);

DROP POLICY IF EXISTS "Admins e franqueados podem atualizar janelas" ON public.contrato_janelas_entrega;

CREATE POLICY "contrato_janelas_update_consolidated" ON public.contrato_janelas_entrega
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.contratos_servico cs
    INNER JOIN public.franquia_usuarios fu ON fu.franquia_id = cs.franquia_id
    WHERE cs.id = contrato_janelas_entrega.contrato_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
);

DROP POLICY IF EXISTS "Admins e franqueados podem deletar janelas" ON public.contrato_janelas_entrega;

CREATE POLICY "contrato_janelas_delete_consolidated" ON public.contrato_janelas_entrega
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.contratos_servico cs
    INNER JOIN public.franquia_usuarios fu ON fu.franquia_id = cs.franquia_id
    WHERE cs.id = contrato_janelas_entrega.contrato_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
);

-- ============================================================================
-- TABELA: veiculos (3 políticas cada operação → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all vehicles" ON public.veiculos;
DROP POLICY IF EXISTS "Admins can manage veiculos" ON public.veiculos;
DROP POLICY IF EXISTS "Franqueados can manage their vehicles" ON public.veiculos;

CREATE POLICY "veiculos_select_consolidated" ON public.veiculos
FOR SELECT
USING (
  -- Admins podem ver todos os veículos
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Usuários podem ver seus próprios veículos
  veiculos.user_id = auth.uid()
);

CREATE POLICY "veiculos_insert_consolidated" ON public.veiculos
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  veiculos.user_id = auth.uid()
);

CREATE POLICY "veiculos_update_consolidated" ON public.veiculos
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  veiculos.user_id = auth.uid()
);

CREATE POLICY "veiculos_delete_consolidated" ON public.veiculos
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  veiculos.user_id = auth.uid()
);

-- ============================================================================
-- TABELA: motoristas (3 políticas cada operação → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all drivers" ON public.motoristas;
DROP POLICY IF EXISTS "Admins can manage motoristas" ON public.motoristas;
DROP POLICY IF EXISTS "Franqueados can manage their drivers" ON public.motoristas;

CREATE POLICY "motoristas_select_consolidated" ON public.motoristas
FOR SELECT
USING (
  -- Admins podem ver todos os motoristas
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Usuários podem ver seus próprios dados
  motoristas.user_id = auth.uid()
  OR
  -- Motoristas podem ver seu próprio perfil
  motoristas.auth_user_id = auth.uid()
);

CREATE POLICY "motoristas_insert_consolidated" ON public.motoristas
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  motoristas.user_id = auth.uid()
);

CREATE POLICY "motoristas_update_consolidated" ON public.motoristas
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  motoristas.user_id = auth.uid()
  OR
  motoristas.auth_user_id = auth.uid()
);

CREATE POLICY "motoristas_delete_consolidated" ON public.motoristas
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  motoristas.user_id = auth.uid()
);

-- ============================================================================
-- TABELA: pallet_positions (3 políticas SELECT → 1 consolidada)
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage pallet positions" ON public.pallet_positions;
DROP POLICY IF EXISTS "Users can view pallet positions" ON public.pallet_positions;
DROP POLICY IF EXISTS "View pallet positions by franchise hierarchy" ON public.pallet_positions;

CREATE POLICY "pallet_positions_select_consolidated" ON public.pallet_positions
FOR SELECT
USING (
  -- Admins podem ver todas as posições
  public.check_user_role_safe(auth.uid(), 'admin')
  OR
  -- Franqueados podem ver posições de seus depósitos
  EXISTS (
    SELECT 1 FROM public.entrada_pallets ep
    INNER JOIN public.entradas e ON e.id = ep.entrada_id
    INNER JOIN public.franquia_usuarios fu ON fu.franquia_id = e.deposito_id
    WHERE ep.id = pallet_positions.pallet_id
    AND fu.user_id = auth.uid()
    AND fu.ativo = true
  )
);