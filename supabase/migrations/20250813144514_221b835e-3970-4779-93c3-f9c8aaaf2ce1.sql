-- 1) Create permission enum and table for granular permissions
DO $$ BEGIN
  CREATE TYPE public.permission_code AS ENUM (
    'estoque.view',
    'estoque.manage',
    'entradas.manage',
    'saidas.manage'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission public.permission_code NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 2) Helper functions
CREATE OR REPLACE FUNCTION public.is_ancestor(_parent uuid, _child uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE tree AS (
    SELECT uh.child_user_id
    FROM public.user_hierarchy uh
    WHERE uh.parent_user_id = _parent
    UNION
    SELECT uh2.child_user_id
    FROM public.user_hierarchy uh2
    JOIN tree t ON uh2.parent_user_id = t.child_user_id
  )
  SELECT EXISTS (SELECT 1 FROM tree WHERE child_user_id = _child);
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm public.permission_code)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = _user_id AND up.permission = _perm
  );
$$;

-- 3) Update can_view_user_data to support produtor hierarchy too
CREATE OR REPLACE FUNCTION public.can_view_user_data(_viewer uuid, _owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT
    _viewer = _owner
    OR public.has_role(_viewer, 'admin')
    OR (
      (public.has_role(_viewer, 'franqueado') OR public.has_role(_viewer, 'produtor'))
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
$function$;

-- 4) RLS policies for user_permissions
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Parents manage descendant permissions" ON public.user_permissions;
CREATE POLICY "Parents manage descendant permissions"
ON public.user_permissions
FOR ALL
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), permission))
WITH CHECK (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), permission));

DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- 5) Relax hierarchy management so non-admins can manage their own subtree
-- Keep existing admin policy as-is; add user-scoped ones
DROP POLICY IF EXISTS "Users can manage their own parent links (insert)" ON public.user_hierarchy;
CREATE POLICY "Users can manage their own parent links (insert)"
ON public.user_hierarchy
FOR INSERT
WITH CHECK (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "Users can delete their own parent links" ON public.user_hierarchy;
CREATE POLICY "Users can delete their own parent links"
ON public.user_hierarchy
FOR DELETE
USING (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "Users can view their hierarchy links" ON public.user_hierarchy;
CREATE POLICY "Users can view their hierarchy links"
ON public.user_hierarchy
FOR SELECT
USING (auth.uid() = parent_user_id OR auth.uid() = child_user_id);

-- 6) Harden user_roles and allow parents to grant their role to descendants
DROP POLICY IF EXISTS "Users manage own roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can view descendant roles" ON public.user_roles;
CREATE POLICY "Parents can view descendant roles"
ON public.user_roles
FOR SELECT
USING (public.is_ancestor(auth.uid(), user_id));

DROP POLICY IF EXISTS "Parents can grant their role to descendants" ON public.user_roles;
CREATE POLICY "Parents can grant their role to descendants"
ON public.user_roles
FOR INSERT
WITH CHECK (
  public.is_ancestor(auth.uid(), user_id)
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = user_roles.role
  )
);

DROP POLICY IF EXISTS "Parents can revoke their role from descendants" ON public.user_roles;
CREATE POLICY "Parents can revoke their role from descendants"
ON public.user_roles
FOR DELETE
USING (
  public.is_ancestor(auth.uid(), user_id)
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = user_roles.role
  )
);

-- 7) Extend domain table policies for subaccount manage permissions
-- Entradas
DROP POLICY IF EXISTS "Ancestors with entradas.manage can insert" ON public.entradas;
CREATE POLICY "Ancestors with entradas.manage can insert"
ON public.entradas
FOR INSERT
WITH CHECK (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

DROP POLICY IF EXISTS "Ancestors with entradas.manage can update" ON public.entradas;
CREATE POLICY "Ancestors with entradas.manage can update"
ON public.entradas
FOR UPDATE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

DROP POLICY IF EXISTS "Ancestors with entradas.manage can delete" ON public.entradas;
CREATE POLICY "Ancestors with entradas.manage can delete"
ON public.entradas
FOR DELETE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

-- Saidas
DROP POLICY IF EXISTS "Ancestors with saidas.manage can insert" ON public.saidas;
CREATE POLICY "Ancestors with saidas.manage can insert"
ON public.saidas
FOR INSERT
WITH CHECK (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));

DROP POLICY IF EXISTS "Ancestors with saidas.manage can update" ON public.saidas;
CREATE POLICY "Ancestors with saidas.manage can update"
ON public.saidas
FOR UPDATE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));

DROP POLICY IF EXISTS "Ancestors with saidas.manage can delete" ON public.saidas;
CREATE POLICY "Ancestors with saidas.manage can delete"
ON public.saidas
FOR DELETE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));

-- Estoque
DROP POLICY IF EXISTS "Ancestors with estoque.manage can insert" ON public.estoque;
CREATE POLICY "Ancestors with estoque.manage can insert"
ON public.estoque
FOR INSERT
WITH CHECK (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'estoque.manage'));

DROP POLICY IF EXISTS "Ancestors with estoque.manage can update" ON public.estoque;
CREATE POLICY "Ancestors with estoque.manage can update"
ON public.estoque
FOR UPDATE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'estoque.manage'));

DROP POLICY IF EXISTS "Ancestors with estoque.manage can delete" ON public.estoque;
CREATE POLICY "Ancestors with estoque.manage can delete"
ON public.estoque
FOR DELETE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'estoque.manage'));

-- Itens de entrada
DROP POLICY IF EXISTS "Ancestors with entradas.manage can insert itens" ON public.entrada_itens;
CREATE POLICY "Ancestors with entradas.manage can insert itens"
ON public.entrada_itens
FOR INSERT
WITH CHECK (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

DROP POLICY IF EXISTS "Ancestors with entradas.manage can update itens" ON public.entrada_itens;
CREATE POLICY "Ancestors with entradas.manage can update itens"
ON public.entrada_itens
FOR UPDATE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

DROP POLICY IF EXISTS "Ancestors with entradas.manage can delete itens" ON public.entrada_itens;
CREATE POLICY "Ancestors with entradas.manage can delete itens"
ON public.entrada_itens
FOR DELETE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'entradas.manage'));

-- Itens de saída
DROP POLICY IF EXISTS "Ancestors with saidas.manage can insert itens" ON public.saida_itens;
CREATE POLICY "Ancestors with saidas.manage can insert itens"
ON public.saida_itens
FOR INSERT
WITH CHECK (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));

DROP POLICY IF EXISTS "Ancestors with saidas.manage can update itens" ON public.saida_itens;
CREATE POLICY "Ancestors with saidas.manage can update itens"
ON public.saida_itens
FOR UPDATE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));

DROP POLICY IF EXISTS "Ancestors with saidas.manage can delete itens" ON public.saida_itens;
CREATE POLICY "Ancestors with saidas.manage can delete itens"
ON public.saida_itens
FOR DELETE
USING (public.is_ancestor(auth.uid(), user_id) AND public.has_permission(auth.uid(), 'saidas.manage'));
