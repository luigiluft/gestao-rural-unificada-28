-- Enforce that a user with role 'produtor' must be linked to at least one 'franqueado'
-- and prevent breaking this rule via hierarchy changes.

-- 1) Validate assigning role 'produtor' only when a franqueado parent exists
CREATE OR REPLACE FUNCTION public.validate_produtor_has_franqueado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_parent boolean;
BEGIN
  IF NEW.role = 'produtor' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_hierarchy uh
      JOIN public.user_roles ur ON ur.user_id = uh.parent_user_id AND ur.role = 'franqueado'
      WHERE uh.child_user_id = NEW.user_id
    ) INTO has_parent;

    IF NOT has_parent THEN
      RAISE EXCEPTION 'Não é possível atribuir o papel "produtor" sem estar vinculado a um franqueado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_produtor_on_roles ON public.user_roles;
CREATE TRIGGER trg_validate_produtor_on_roles
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_produtor_has_franqueado();

-- 2) Validate hierarchy changes to keep producers linked to a franqueado
CREATE OR REPLACE FUNCTION public.validate_hierarchy_for_produtor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_produtor boolean;
  remaining_franqueados_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- If child is produtor, ensure at least one other franqueado parent remains
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = OLD.child_user_id AND role = 'produtor'
    ) INTO is_produtor;

    IF is_produtor THEN
      SELECT count(*) INTO remaining_franqueados_count
      FROM public.user_hierarchy uh
      JOIN public.user_roles ur ON ur.user_id = uh.parent_user_id AND ur.role = 'franqueado'
      WHERE uh.child_user_id = OLD.child_user_id
        AND NOT (uh.parent_user_id = OLD.parent_user_id);

      IF remaining_franqueados_count = 0 THEN
        RAISE EXCEPTION 'Produtor deve permanecer vinculado a pelo menos um franqueado.';
      END IF;
    END IF;

    RETURN OLD;
  ELSIF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If child is produtor, parent must be franqueado
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.child_user_id AND role = 'produtor'
    ) INTO is_produtor;

    IF is_produtor THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = NEW.parent_user_id AND role = 'franqueado'
      ) THEN
        RAISE EXCEPTION 'Um produtor só pode ser vinculado a usuários com papel de franqueado.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_hierarchy_for_produtor_del ON public.user_hierarchy;
CREATE TRIGGER trg_validate_hierarchy_for_produtor_del
BEFORE DELETE ON public.user_hierarchy
FOR EACH ROW
EXECUTE FUNCTION public.validate_hierarchy_for_produtor();

DROP TRIGGER IF EXISTS trg_validate_hierarchy_for_produtor_insupd ON public.user_hierarchy;
CREATE TRIGGER trg_validate_hierarchy_for_produtor_insupd
BEFORE INSERT OR UPDATE ON public.user_hierarchy
FOR EACH ROW
EXECUTE FUNCTION public.validate_hierarchy_for_produtor();