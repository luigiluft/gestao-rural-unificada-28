-- ================================================
-- FIX: Infinite Recursion in franquia_usuarios RLS
-- ================================================

-- 1. Create SECURITY DEFINER helper functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.user_is_franquia_member(p_user_id uuid, p_franquia_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.franquia_usuarios
    WHERE user_id = p_user_id 
      AND franquia_id = p_franquia_id 
      AND ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_franquia_master(p_user_id uuid, p_franquia_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.franquia_usuarios
    WHERE user_id = p_user_id 
      AND franquia_id = p_franquia_id 
      AND papel = 'master'
      AND ativo = true
  );
$$;

-- 2. Drop ALL existing RLS policies on franquia_usuarios
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'franquia_usuarios' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.franquia_usuarios';
    END LOOP;
END $$;

-- 3. Create new consolidated RLS policies using helper functions

-- SELECT policy: Users can see their own associations + admins see all
CREATE POLICY "franquia_usuarios_select_policy"
ON public.franquia_usuarios
FOR SELECT
USING (
  auth.uid() = user_id  -- Users see their own
  OR public.get_user_role_direct(auth.uid()) = 'admin'  -- Admins see all
);

-- INSERT policy: Admins can insert any + masters can insert to their franchises
CREATE POLICY "franquia_usuarios_insert_policy"
ON public.franquia_usuarios
FOR INSERT
WITH CHECK (
  public.get_user_role_direct(auth.uid()) = 'admin'  -- Admins can insert
  OR public.user_belongs_to_franquia(auth.uid(), franquia_id)  -- Users in franchise can add others
);

-- UPDATE policy: Admins can update any + masters can update their franchise users
CREATE POLICY "franquia_usuarios_update_policy"
ON public.franquia_usuarios
FOR UPDATE
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'  -- Admins can update
  OR public.user_belongs_to_franquia(auth.uid(), franquia_id)  -- Users in franchise can update
);

-- DELETE policy: Admins can delete any + masters can delete from their franchises
CREATE POLICY "franquia_usuarios_delete_policy"
ON public.franquia_usuarios
FOR DELETE
USING (
  public.get_user_role_direct(auth.uid()) = 'admin'  -- Admins can delete
  OR public.user_belongs_to_franquia(auth.uid(), franquia_id)  -- Users in franchise can delete
);