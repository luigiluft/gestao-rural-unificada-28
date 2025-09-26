-- Reorganizar sistema de roles para eliminar confusão (sem subquery em CHECK constraint)
-- 1. Renomear tabela employee_profiles para permission_templates
ALTER TABLE public.employee_profiles RENAME TO permission_templates;

-- 2. Renomear coluna role para target_role para clarificar propósito
ALTER TABLE public.permission_templates RENAME COLUMN role TO target_role;

-- 3. Atualizar índices e constraints
ALTER INDEX IF EXISTS employee_profiles_pkey RENAME TO permission_templates_pkey;
ALTER INDEX IF EXISTS idx_employee_profiles_user_id RENAME TO idx_permission_templates_user_id;

-- 4. Atualizar tabela user_employee_profiles para refletir nova nomenclatura
ALTER TABLE public.user_employee_profiles RENAME TO user_permission_templates;

-- 5. Renomear foreign key references
ALTER TABLE public.user_permission_templates RENAME COLUMN profile_id TO template_id;

-- 6. Adicionar comentários para documentar a hierarquia
COMMENT ON TABLE public.permission_templates IS 'Templates de permissões que definem conjuntos de permissões para diferentes roles. Usado para criar perfis de funcionários/subcontas.';
COMMENT ON COLUMN public.permission_templates.target_role IS 'Role alvo para este template de permissões (admin/franqueado/produtor)';
COMMENT ON TABLE public.user_permission_templates IS 'Atribuição de templates de permissões específicos para subcontas';
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com role principal do sistema. Este é o role usado para autenticação e RLS policies.';
COMMENT ON COLUMN public.profiles.role IS 'Role principal do usuário no sistema (admin > franqueado > produtor)';

-- 7. Atualizar RLS policies para refletir nova nomenclatura
DROP POLICY IF EXISTS "Users can manage employee profiles" ON public.permission_templates;
DROP POLICY IF EXISTS "Users can create employee profiles" ON public.permission_templates;
DROP POLICY IF EXISTS "Users can update employee profiles" ON public.permission_templates;
DROP POLICY IF EXISTS "Users can delete employee profiles" ON public.permission_templates;
DROP POLICY IF EXISTS "Users can view employee profiles" ON public.permission_templates;

-- Criar novas policies com nomenclatura clara
CREATE POLICY "Users can view permission templates"
ON public.permission_templates FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'franqueado'::app_role) AND target_role IN ('franqueado', 'produtor'))
);

CREATE POLICY "Users can create permission templates"
ON public.permission_templates FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND (
    (has_role(auth.uid(), 'admin'::app_role)) OR
    (has_role(auth.uid(), 'franqueado'::app_role) AND target_role IN ('franqueado', 'produtor')) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND target_role = 'produtor')
  )
);

CREATE POLICY "Users can update their permission templates"
ON public.permission_templates FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their permission templates"
ON public.permission_templates FOR DELETE
USING (user_id = auth.uid());

-- 8. Atualizar policies para user_permission_templates
DROP POLICY IF EXISTS "Admins can manage all profile assignments" ON public.user_permission_templates;
DROP POLICY IF EXISTS "Masters can manage profile assignments for their subaccounts" ON public.user_permission_templates;
DROP POLICY IF EXISTS "Users can view their own profile assignment" ON public.user_permission_templates;

CREATE POLICY "Admins can manage all template assignments"
ON public.user_permission_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Masters can manage template assignments for their subaccounts"
ON public.user_permission_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_hierarchy uh
    WHERE uh.child_user_id = user_permission_templates.user_id
    AND uh.parent_user_id = auth.uid()
  ) OR user_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_hierarchy uh
    WHERE uh.child_user_id = user_permission_templates.user_id
    AND uh.parent_user_id = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "Users can view their own template assignment"
ON user_permission_templates FOR SELECT
USING (user_id = auth.uid());