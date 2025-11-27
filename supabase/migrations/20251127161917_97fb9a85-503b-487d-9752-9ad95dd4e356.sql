-- ================================================
-- PHASE 2 PART 2: Freight & Transport (CORRECTED SCHEMAS)
-- ================================================

-- 1. TABELAS_FRETE (has: franqueado_id, user_id)
DROP POLICY IF EXISTS "Admin pode ver todas tabelas de frete" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Franqueados veem tabelas de suas franquias" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Admin pode criar tabelas de frete" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Franqueados podem criar tabelas" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Admin pode atualizar tabelas de frete" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Franqueados podem atualizar suas tabelas" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Admin pode deletar tabelas de frete" ON public.tabelas_frete;

CREATE POLICY "tabelas_frete_consol" ON public.tabelas_frete
FOR ALL USING (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR is_ancestor(user_id, auth.uid())
) WITH CHECK (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
);

-- 2. FRETE_FAIXAS (has: tabela_frete_id)
DROP POLICY IF EXISTS "Admin pode ver todas faixas" ON public.frete_faixas;
DROP POLICY IF EXISTS "Franqueados veem faixas de suas tabelas" ON public.frete_faixas;
DROP POLICY IF EXISTS "Admin pode criar faixas" ON public.frete_faixas;
DROP POLICY IF EXISTS "Franqueados podem criar faixas em suas tabelas" ON public.frete_faixas;
DROP POLICY IF EXISTS "Admin pode atualizar faixas" ON public.frete_faixas;
DROP POLICY IF EXISTS "Franqueados podem atualizar faixas de suas tabelas" ON public.frete_faixas;
DROP POLICY IF EXISTS "Admin pode deletar faixas" ON public.frete_faixas;

CREATE POLICY "frete_faixas_consol" ON public.frete_faixas
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tabelas_frete tf WHERE tf.id = tabela_frete_id AND (tf.user_id = auth.uid() OR is_ancestor(tf.user_id, auth.uid())))
  OR check_user_role_safe(auth.uid(), 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.tabelas_frete tf WHERE tf.id = tabela_frete_id AND (tf.user_id = auth.uid() OR is_ancestor(tf.user_id, auth.uid())))
  OR check_user_role_safe(auth.uid(), 'admin')
);

-- 3. TABELA_FRETE_REGRAS (has: tabela_id not tabela_frete_id!)
DROP POLICY IF EXISTS "Admin pode ver todas regras" ON public.tabela_frete_regras;
DROP POLICY IF EXISTS "Franqueados veem regras de suas tabelas" ON public.tabela_frete_regras;
DROP POLICY IF EXISTS "Admin pode criar regras" ON public.tabela_frete_regras;
DROP POLICY IF EXISTS "Franqueados podem criar regras em suas tabelas" ON public.tabela_frete_regras;
DROP POLICY IF EXISTS "Admin pode atualizar regras" ON public.tabela_frete_regras;
DROP POLICY IF EXISTS "Franqueados podem atualizar regras de suas tabelas" ON public.tabela_frete_regras;
DROP POLICY IF EXISTS "Admin pode deletar regras" ON public.tabela_frete_regras;

CREATE POLICY "frete_regras_consol" ON public.tabela_frete_regras
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tabelas_frete tf WHERE tf.id = tabela_id AND (tf.user_id = auth.uid() OR is_ancestor(tf.user_id, auth.uid())))
  OR check_user_role_safe(auth.uid(), 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.tabelas_frete tf WHERE tf.id = tabela_id AND (tf.user_id = auth.uid() OR is_ancestor(tf.user_id, auth.uid())))
  OR check_user_role_safe(auth.uid(), 'admin')
);

-- 4. TRANSPORTADORAS (has: user_id not franqueado_id!)
DROP POLICY IF EXISTS "Admin pode ver todas transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Franqueados veem transportadoras de suas franquias" ON public.transportadoras;
DROP POLICY IF EXISTS "Admin pode criar transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Franqueados podem criar transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Admin pode atualizar transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Franqueados podem atualizar suas transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Admin pode deletar transportadoras" ON public.transportadoras;

CREATE POLICY "transportadoras_consol" ON public.transportadoras
FOR ALL USING (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
  OR is_ancestor(user_id, auth.uid())
) WITH CHECK (
  user_id = auth.uid()
  OR check_user_role_safe(auth.uid(), 'admin')
);