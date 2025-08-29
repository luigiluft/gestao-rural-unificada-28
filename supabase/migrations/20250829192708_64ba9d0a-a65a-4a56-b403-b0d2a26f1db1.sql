-- Fase 1: Criar nova tabela para vincular subcontas aos perfis
CREATE TABLE user_employee_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, profile_id)
);

-- Enable RLS
ALTER TABLE user_employee_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_employee_profiles
CREATE POLICY "Users can view their own profile assignment"
ON user_employee_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Masters can manage profile assignments for their subaccounts"
ON user_employee_profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_hierarchy uh 
    WHERE uh.child_user_id = user_employee_profiles.user_id 
    AND uh.parent_user_id = auth.uid()
  )
  OR user_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_hierarchy uh 
    WHERE uh.child_user_id = user_employee_profiles.user_id 
    AND uh.parent_user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can manage all profile assignments"
ON user_employee_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrar permissões existentes das subcontas para employee_profiles
-- Primeiro, criar perfis automáticos para subcontas que têm permissões individuais
INSERT INTO employee_profiles (user_id, nome, descricao, role, permissions, is_template)
SELECT 
  uh.parent_user_id as user_id,
  'Perfil Auto - ' || p.nome as nome,
  'Perfil criado automaticamente durante migração para: ' || p.nome as descricao,
  p.role,
  ARRAY(
    SELECT up.permission 
    FROM user_permissions up 
    WHERE up.user_id = uh.child_user_id
  ) as permissions,
  false as is_template
FROM user_hierarchy uh
JOIN profiles p ON p.user_id = uh.child_user_id
WHERE EXISTS (
  SELECT 1 FROM user_permissions up 
  WHERE up.user_id = uh.child_user_id
)
ON CONFLICT DO NOTHING;

-- Agora vincular as subcontas aos perfis criados
INSERT INTO user_employee_profiles (user_id, profile_id, assigned_by)
SELECT 
  uh.child_user_id as user_id,
  ep.id as profile_id,
  uh.parent_user_id as assigned_by
FROM user_hierarchy uh
JOIN profiles p ON p.user_id = uh.child_user_id
JOIN employee_profiles ep ON ep.user_id = uh.parent_user_id 
  AND ep.role = p.role 
  AND ep.nome LIKE 'Perfil Auto - ' || p.nome
WHERE EXISTS (
  SELECT 1 FROM user_permissions up 
  WHERE up.user_id = uh.child_user_id
)
ON CONFLICT DO NOTHING;

-- Função helper para verificar se usuário é subconta
CREATE OR REPLACE FUNCTION public.is_subaccount(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_hierarchy
    WHERE child_user_id = _user_id
  );
$$;