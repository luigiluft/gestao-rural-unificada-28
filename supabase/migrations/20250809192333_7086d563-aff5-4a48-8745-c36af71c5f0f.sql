-- Promote specific user to admin by email (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('lucca+1@luft.com.br')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'admin'::public.app_role
  );
