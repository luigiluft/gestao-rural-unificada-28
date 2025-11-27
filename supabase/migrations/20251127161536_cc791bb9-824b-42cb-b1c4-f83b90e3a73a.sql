-- ================================================
-- PHASE 2: RLS CONSOLIDATION - Only confirmed tables
-- ================================================

-- 1. COMPROVANTES_ENTREGA
DROP POLICY IF EXISTS "Admin pode ver todos comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Motoristas veem seus comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Motoristas podem criar comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Admin pode criar comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Motoristas podem atualizar seus comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Admin pode atualizar comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Admin pode deletar comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Admins can manage all comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Admins can manage all comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Drivers can select comprovantes for assigned deliveries" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Drivers can update comprovantes for assigned deliveries" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Drivers can view their assigned deliveries" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can insert own comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can manage their own comprovantes" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can select own comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can update own comprovantes_entrega" ON public.comprovantes_entrega;

CREATE POLICY "comprovantes_select_consol" ON public.comprovantes_entrega
FOR SELECT USING (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM delivery_assignments da JOIN motoristas m ON m.id = da.motorista_id WHERE da.comprovante_id = comprovantes_entrega.id AND m.auth_user_id = auth.uid())
);

CREATE POLICY "comprovantes_insert_consol" ON public.comprovantes_entrega
FOR INSERT WITH CHECK (user_id = auth.uid() OR check_user_role_safe(auth.uid(), 'admin'));

CREATE POLICY "comprovantes_update_consol" ON public.comprovantes_entrega
FOR UPDATE USING (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM delivery_assignments da JOIN motoristas m ON m.id = da.motorista_id WHERE da.comprovante_id = comprovantes_entrega.id AND m.auth_user_id = auth.uid())
);

CREATE POLICY "comprovantes_delete_consol" ON public.comprovantes_entrega
FOR DELETE USING (check_user_role_safe(auth.uid(), 'admin'));

-- 2. COMPROVANTE_FOTOS
DROP POLICY IF EXISTS "Admins can manage all comprovante_fotos" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Drivers can manage photos for assigned deliveries" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Franqueados can view photos from their drivers" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Users can insert photos for their comprovantes" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Users can view photos of their comprovantes" ON public.comprovante_fotos;

CREATE POLICY "fotos_select_consol" ON public.comprovante_fotos
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.comprovantes_entrega ce WHERE ce.id = comprovante_id AND ce.user_id = auth.uid())
  OR check_user_role_safe(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM delivery_assignments da JOIN motoristas m ON m.id = da.motorista_id WHERE da.comprovante_id = comprovante_id AND m.auth_user_id = auth.uid())
);

CREATE POLICY "fotos_insert_consol" ON public.comprovante_fotos
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.comprovantes_entrega ce WHERE ce.id = comprovante_id AND ce.user_id = auth.uid())
  OR check_user_role_safe(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM delivery_assignments da JOIN motoristas m ON m.id = da.motorista_id WHERE da.comprovante_id = comprovante_id AND m.auth_user_id = auth.uid())
);

CREATE POLICY "fotos_delete_consol" ON public.comprovante_fotos
FOR DELETE USING (check_user_role_safe(auth.uid(), 'admin'));

-- 3. RASTREAMENTOS
DROP POLICY IF EXISTS "Admin pode ver todos rastreamentos" ON public.rastreamentos;
DROP POLICY IF EXISTS "Produtores veem seus rastreamentos" ON public.rastreamentos;
DROP POLICY IF EXISTS "Admin pode criar rastreamentos" ON public.rastreamentos;
DROP POLICY IF EXISTS "Sistema pode criar rastreamentos" ON public.rastreamentos;
DROP POLICY IF EXISTS "Admin pode atualizar rastreamentos" ON public.rastreamentos;
DROP POLICY IF EXISTS "Sistema pode atualizar rastreamentos" ON public.rastreamentos;

CREATE POLICY "rastreamentos_consol" ON public.rastreamentos
FOR ALL USING (user_id = auth.uid() OR check_user_role_safe(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR check_user_role_safe(auth.uid(), 'admin'));

-- 4. RASTREAMENTO_HISTORICO
DROP POLICY IF EXISTS "Admin pode ver todo histórico" ON public.rastreamento_historico;
DROP POLICY IF EXISTS "Produtores veem histórico de seus rastreamentos" ON public.rastreamento_historico;
DROP POLICY IF EXISTS "Admin pode criar histórico" ON public.rastreamento_historico;
DROP POLICY IF EXISTS "Sistema pode criar histórico" ON public.rastreamento_historico;

CREATE POLICY "rastreamento_historico_consol" ON public.rastreamento_historico
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rastreamentos r WHERE r.id = rastreamento_id AND r.user_id = auth.uid())
  OR check_user_role_safe(auth.uid(), 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.rastreamentos r WHERE r.id = rastreamento_id AND r.user_id = auth.uid())
  OR check_user_role_safe(auth.uid(), 'admin')
);

-- 5. PRODUTOS
DROP POLICY IF EXISTS "Admin pode ver todos produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários veem seus produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admin pode criar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários podem criar seus produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admin pode atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admin pode deletar produtos" ON public.produtos;

CREATE POLICY "produtos_consol" ON public.produtos
FOR ALL USING (user_id = auth.uid() OR check_user_role_safe(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR check_user_role_safe(auth.uid(), 'admin'));

-- 6. DIVERGENCIAS
DROP POLICY IF EXISTS "Users can create divergences" ON public.divergencias;
DROP POLICY IF EXISTS "Users can update divergences they manage" ON public.divergencias;
DROP POLICY IF EXISTS "Users can view divergences they manage" ON public.divergencias;

CREATE POLICY "divergencias_select_consol" ON public.divergencias
FOR SELECT USING (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR public.user_belongs_to_franquia(auth.uid(), deposito_id)
);

CREATE POLICY "divergencias_insert_consol" ON public.divergencias
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR public.user_belongs_to_franquia(auth.uid(), deposito_id)
);

CREATE POLICY "divergencias_update_consol" ON public.divergencias
FOR UPDATE USING (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR public.user_belongs_to_franquia(auth.uid(), deposito_id)
);

CREATE POLICY "divergencias_delete_consol" ON public.divergencias
FOR DELETE USING (check_user_role_safe(auth.uid(), 'admin'));