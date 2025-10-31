-- Add page_permissions entries for Contratos page for admin and franqueado
-- Also ensure permission_code enum includes 'contratos.view' (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_code' AND e.enumlabel = 'contratos.view'
  ) THEN
    ALTER TYPE public.permission_code ADD VALUE 'contratos.view';
  END IF;
END $$;

-- Insert page access rules if missing
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu, created_at, updated_at)
SELECT 'contratos', 'admin'::app_role, true, true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.page_permissions WHERE page_key = 'contratos' AND role = 'admin'
);

INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu, created_at, updated_at)
SELECT 'contratos', 'franqueado'::app_role, true, true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.page_permissions WHERE page_key = 'contratos' AND role = 'franqueado'
);
