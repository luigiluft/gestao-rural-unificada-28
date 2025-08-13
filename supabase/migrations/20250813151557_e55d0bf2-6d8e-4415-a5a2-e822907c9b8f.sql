-- Create pending_invites and produtores tables, RLS, and triggers to process invites

-- 1) pending_invites: store role, parent hierarchy and permissions for invited emails
CREATE TABLE IF NOT EXISTS public.pending_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  inviter_user_id uuid NOT NULL,
  parent_user_id uuid,
  role app_role,
  permissions permission_code[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON public.pending_invites (lower(email));
CREATE INDEX IF NOT EXISTS idx_pending_invites_parent ON public.pending_invites (parent_user_id);

-- RLS policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pending_invites' AND policyname = 'Admins manage all invites'
  ) THEN
    CREATE POLICY "Admins manage all invites" ON public.pending_invites
    FOR ALL
    USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pending_invites' AND policyname = 'Inviter manages own invites'
  ) THEN
    CREATE POLICY "Inviter manages own invites" ON public.pending_invites
    FOR ALL
    USING (auth.uid() = inviter_user_id)
    WITH CHECK (auth.uid() = inviter_user_id);
  END IF;
END $$;

-- 2) produtores table to track produtor accounts (metadata placeholder)
CREATE TABLE IF NOT EXISTS public.produtores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.produtores ENABLE ROW LEVEL SECURITY;

-- RLS: admins manage all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'produtores' AND policyname = 'Admins manage all produtores'
  ) THEN
    CREATE POLICY "Admins manage all produtores" ON public.produtores
    FOR ALL
    USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- RLS: users manage own row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'produtores' AND policyname = 'Users manage own produtor row'
  ) THEN
    CREATE POLICY "Users manage own produtor row" ON public.produtores
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS: Parents (franqueado) manage descendants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'produtores' AND policyname = 'Franqueados manage descendant produtores'
  ) THEN
    CREATE POLICY "Franqueados manage descendant produtores" ON public.produtores
    FOR ALL
    USING (is_ancestor(auth.uid(), user_id) AND has_role(auth.uid(), 'franqueado'))
    WITH CHECK (is_ancestor(auth.uid(), user_id) AND has_role(auth.uid(), 'franqueado'));
  END IF;
END $$;

-- updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_produtores_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_produtores_updated_at
    BEFORE UPDATE ON public.produtores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Sync produtores rows when role 'produtor' is added/removed
CREATE OR REPLACE FUNCTION public.sync_produtor_row_on_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'produtor' THEN
    INSERT INTO public.produtores(user_id) VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'produtor' THEN
    DELETE FROM public.produtores WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_produtor_on_role_ins'
  ) THEN
    CREATE TRIGGER trg_sync_produtor_on_role_ins
    AFTER INSERT ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.sync_produtor_row_on_role();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_produtor_on_role_del'
  ) THEN
    CREATE TRIGGER trg_sync_produtor_on_role_del
    AFTER DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.sync_produtor_row_on_role();
  END IF;
END $$;

-- 4) Process pending_invites when a profile is created
CREATE OR REPLACE FUNCTION public.process_pending_invite_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  perm permission_code;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO inv
  FROM public.pending_invites
  WHERE lower(email) = lower(NEW.email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF inv IS NULL THEN
    RETURN NEW;
  END IF;

  -- Link hierarchy if provided
  IF inv.parent_user_id IS NOT NULL THEN
    INSERT INTO public.user_hierarchy(parent_user_id, child_user_id)
    VALUES (inv.parent_user_id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign role if provided
  IF inv.role IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.user_id, inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Grant permissions if provided
  IF inv.permissions IS NOT NULL THEN
    FOREACH perm IN ARRAY inv.permissions LOOP
      INSERT INTO public.user_permissions(user_id, permission)
      VALUES (NEW.user_id, perm)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  UPDATE public.pending_invites SET used_at = now() WHERE id = inv.id;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_process_pending_invite_on_profile'
  ) THEN
    CREATE TRIGGER trg_process_pending_invite_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.process_pending_invite_on_profile();
  END IF;
END $$;