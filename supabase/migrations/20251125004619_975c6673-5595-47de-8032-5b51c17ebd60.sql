-- Fase 2.1: Resolver conflito de hierarquia - lucca+3 é MASTER
DELETE FROM user_hierarchy
WHERE child_user_id IN (
  SELECT upt.user_id 
  FROM user_permission_templates upt
  JOIN permission_templates pt ON pt.id = upt.template_id
  WHERE pt.nome = 'Administrador'
);

-- Fase 3: REFATORAÇÃO ESTRUTURAL - Sistema Unificado de Permissões

-- Criar tabela de permissões computadas (cache de 10 minutos)
CREATE TABLE IF NOT EXISTS public.user_computed_permissions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_subaccount BOOLEAN NOT NULL DEFAULT false,
  role app_role,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes',
  CONSTRAINT user_computed_permissions_valid_permissions 
    CHECK (jsonb_typeof(permissions) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_user_computed_permissions_expires 
ON public.user_computed_permissions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_computed_permissions_user_id 
ON public.user_computed_permissions(user_id);

-- Habilitar RLS
ALTER TABLE public.user_computed_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem ver apenas suas próprias permissões
CREATE POLICY "Users can view own computed permissions"
ON public.user_computed_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: service role pode gerenciar (edge functions)
CREATE POLICY "Service role can manage computed permissions"
ON public.user_computed_permissions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Criar Materialized View para estatísticas de franquias
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_franquias_summary AS
SELECT 
  fu.user_id,
  COUNT(DISTINCT fu.franquia_id) as total_franquias,
  COUNT(DISTINCT CASE WHEN fu.papel = 'master' THEN fu.franquia_id END) as total_master,
  COUNT(DISTINCT CASE WHEN fu.papel = 'operador' THEN fu.franquia_id END) as total_operador,
  ARRAY_AGG(DISTINCT f.nome ORDER BY f.nome) FILTER (WHERE f.nome IS NOT NULL) as franquia_names,
  ARRAY_AGG(DISTINCT f.id ORDER BY f.id) FILTER (WHERE f.id IS NOT NULL) as franquia_ids,
  MAX(fu.updated_at) as last_updated
FROM franquia_usuarios fu
JOIN franquias f ON f.id = fu.franquia_id
WHERE fu.ativo = true AND f.ativo = true
GROUP BY fu.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_franquias_summary_user 
ON user_franquias_summary(user_id);

CREATE INDEX IF NOT EXISTS idx_user_franquias_summary_total 
ON user_franquias_summary(total_franquias DESC);

-- Função para atualizar a materialized view
CREATE OR REPLACE FUNCTION public.refresh_user_franquias_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_franquias_summary;
END;
$$;

-- Adicionar índices compostos para otimizar N+1 queries
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_user_franquia 
ON public.franquia_usuarios(user_id, franquia_id, ativo);

CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_created_at 
ON public.franquia_usuarios(user_id, created_at DESC) 
WHERE ativo = true;