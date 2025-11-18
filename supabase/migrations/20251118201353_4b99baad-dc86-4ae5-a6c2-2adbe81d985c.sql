-- Criar tabela de relacionamento franquia_usuarios
CREATE TABLE IF NOT EXISTS public.franquia_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franquia_id UUID NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  papel TEXT NOT NULL DEFAULT 'operador' CHECK (papel IN ('master', 'operador')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(user_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(franquia_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_franquia ON public.franquia_usuarios(franquia_id);
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_user ON public.franquia_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_ativo ON public.franquia_usuarios(ativo);

-- Migrar dados existentes de master_franqueado_id para franquia_usuarios
INSERT INTO public.franquia_usuarios (franquia_id, user_id, papel, ativo)
SELECT 
  id as franquia_id,
  master_franqueado_id as user_id,
  'master' as papel,
  true as ativo
FROM public.franquias
WHERE master_franqueado_id IS NOT NULL
ON CONFLICT (franquia_id, user_id) DO NOTHING;

-- RLS policies para franquia_usuarios
ALTER TABLE public.franquia_usuarios ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar franquia_usuarios"
  ON public.franquia_usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Franqueados podem ver suas próprias associações
CREATE POLICY "Franqueados podem ver suas franquias"
  ON public.franquia_usuarios
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Função helper para verificar se usuário pertence a uma franquia
CREATE OR REPLACE FUNCTION public.user_belongs_to_franquia(p_user_id UUID, p_franquia_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.franquia_usuarios
    WHERE user_id = p_user_id 
      AND franquia_id = p_franquia_id 
      AND ativo = true
  );
$$;

-- Função helper para obter franquias de um usuário
CREATE OR REPLACE FUNCTION public.get_user_franquias(p_user_id UUID)
RETURNS TABLE (franquia_id UUID, papel TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT franquia_id, papel
  FROM public.franquia_usuarios
  WHERE user_id = p_user_id AND ativo = true;
$$;

-- Atualizar RLS policies da tabela franquias para considerar a nova estrutura
DROP POLICY IF EXISTS "Franqueados podem ver e editar sua franquia" ON public.franquias;

CREATE POLICY "Usuários podem ver franquias associadas"
  ON public.franquias
  FOR SELECT
  USING (
    -- Admin pode ver todas
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Usuário está associado à franquia
    EXISTS (
      SELECT 1 FROM public.franquia_usuarios
      WHERE user_id = auth.uid() 
        AND franquia_id = franquias.id 
        AND ativo = true
    )
    OR
    -- Mantém compatibilidade com master_franqueado_id (temporário)
    master_franqueado_id = auth.uid()
  );

CREATE POLICY "Usuários podem editar franquias associadas"
  ON public.franquias
  FOR UPDATE
  USING (
    -- Admin pode editar todas
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Usuário master pode editar
    EXISTS (
      SELECT 1 FROM public.franquia_usuarios
      WHERE user_id = auth.uid() 
        AND franquia_id = franquias.id 
        AND papel = 'master'
        AND ativo = true
    )
    OR
    -- Mantém compatibilidade com master_franqueado_id (temporário)
    master_franqueado_id = auth.uid()
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_franquia_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_franquia_usuarios_updated_at_trigger
  BEFORE UPDATE ON public.franquia_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_franquia_usuarios_updated_at();