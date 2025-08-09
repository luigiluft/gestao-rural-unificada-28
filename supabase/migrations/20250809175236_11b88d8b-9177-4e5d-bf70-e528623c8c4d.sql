-- 1) Enum de roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'franqueado', 'produtor');
  END IF;
END $$;

-- 2) Tabela de roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles (cada usuário só vê/edita seus próprios roles; admin vê todos)
DROP POLICY IF EXISTS "Users manage own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users manage own roles"
ON public.user_roles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- 3) Tabela de hierarquia (franqueado -> filhos)
CREATE TABLE IF NOT EXISTS public.user_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  child_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, child_user_id)
);

ALTER TABLE public.user_hierarchy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own hierarchy" ON public.user_hierarchy;
DROP POLICY IF EXISTS "Admins can manage hierarchy" ON public.user_hierarchy;

-- Apenas admin pode gerenciar hierarquia por padrão
CREATE POLICY "Admins can manage hierarchy"
ON public.user_hierarchy
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- 4) Função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5) Função can_view_user_data usando hierarquia recursiva
CREATE OR REPLACE FUNCTION public.can_view_user_data(_viewer uuid, _owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    _viewer = _owner
    OR public.has_role(_viewer, 'admin')
    OR (
      public.has_role(_viewer, 'franqueado')
      AND EXISTS (
        WITH RECURSIVE tree AS (
          SELECT uh.child_user_id
          FROM public.user_hierarchy uh
          WHERE uh.parent_user_id = _viewer
          UNION
          SELECT uh2.child_user_id
          FROM public.user_hierarchy uh2
          JOIN tree t ON uh2.parent_user_id = t.child_user_id
        )
        SELECT 1 FROM tree WHERE child_user_id = _owner
      )
    );
$$;

-- 6) Atualizar RLS das tabelas de dados para refletir visualização por hierarquia
-- Função auxiliar para criar políticas padronizadas
-- (Não possível parametrizar; aplicaremos em cada tabela)

-- chamados_suporte
DROP POLICY IF EXISTS "Users can manage their own support tickets" ON public.chamados_suporte;
CREATE POLICY "Select visible rows by hierarchy"
ON public.chamados_suporte
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.chamados_suporte
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.chamados_suporte
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.chamados_suporte
FOR DELETE
USING (auth.uid() = user_id);

-- depositos
DROP POLICY IF EXISTS "Users can manage their own warehouses" ON public.depositos;
CREATE POLICY "Select visible rows by hierarchy"
ON public.depositos
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.depositos
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.depositos
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.depositos
FOR DELETE
USING (auth.uid() = user_id);

-- entrada_itens
DROP POLICY IF EXISTS "Users can manage their own entry items" ON public.entrada_itens;
CREATE POLICY "Select visible rows by hierarchy"
ON public.entrada_itens
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.entrada_itens
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.entrada_itens
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.entrada_itens
FOR DELETE
USING (auth.uid() = user_id);

-- entradas
DROP POLICY IF EXISTS "Users can manage their own entries" ON public.entradas;
CREATE POLICY "Select visible rows by hierarchy"
ON public.entradas
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.entradas
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.entradas
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.entradas
FOR DELETE
USING (auth.uid() = user_id);

-- estoque
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.estoque;
CREATE POLICY "Select visible rows by hierarchy"
ON public.estoque
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.estoque
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.estoque
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.estoque
FOR DELETE
USING (auth.uid() = user_id);

-- fornecedores
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.fornecedores;
CREATE POLICY "Select visible rows by hierarchy"
ON public.fornecedores
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.fornecedores
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.fornecedores
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.fornecedores
FOR DELETE
USING (auth.uid() = user_id);

-- movimentacoes
DROP POLICY IF EXISTS "Users can view their own movements" ON public.movimentacoes;
CREATE POLICY "Select visible rows by hierarchy"
ON public.movimentacoes
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.movimentacoes
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.movimentacoes
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.movimentacoes
FOR DELETE
USING (auth.uid() = user_id);

-- produtos
DROP POLICY IF EXISTS "Users can manage their own products" ON public.produtos;
CREATE POLICY "Select visible rows by hierarchy"
ON public.produtos
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.produtos
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.produtos
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.produtos
FOR DELETE
USING (auth.uid() = user_id);

-- rastreamentos
DROP POLICY IF EXISTS "Users can manage their own trackings" ON public.rastreamentos;
CREATE POLICY "Select visible rows by hierarchy"
ON public.rastreamentos
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.rastreamentos
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.rastreamentos
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.rastreamentos
FOR DELETE
USING (auth.uid() = user_id);

-- rastreamento_historico (não tem user_id; usa rastreamentos)
DROP POLICY IF EXISTS "Users can view tracking history through tracking" ON public.rastreamento_historico;
CREATE POLICY "Select visible tracking history"
ON public.rastreamento_historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.rastreamentos r
    WHERE r.id = rastreamento_historico.rastreamento_id
      AND public.can_view_user_data(auth.uid(), r.user_id)
  )
);

-- saidas
DROP POLICY IF EXISTS "Users can manage their own exits" ON public.saidas;
CREATE POLICY "Select visible rows by hierarchy"
ON public.saidas
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.saidas
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.saidas
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.saidas
FOR DELETE
USING (auth.uid() = user_id);

-- saida_itens
DROP POLICY IF EXISTS "Users can manage their own exit items" ON public.saida_itens;
CREATE POLICY "Select visible rows by hierarchy"
ON public.saida_itens
FOR SELECT
USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "Insert own rows"
ON public.saida_itens
FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rows"
ON public.saida_itens
FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Delete own rows"
ON public.saida_itens
FOR DELETE
USING (auth.uid() = user_id);

-- Observação: mantivemos as políticas de profiles como estão (somente o próprio usuário vê/edita o próprio perfil)
