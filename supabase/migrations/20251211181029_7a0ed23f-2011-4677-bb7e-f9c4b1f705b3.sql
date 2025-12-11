-- Drop existing duplicate UPDATE policies on franquias
DROP POLICY IF EXISTS "franquias_update_consolidated" ON public.franquias;
DROP POLICY IF EXISTS "franquias_update_policy" ON public.franquias;

-- Drop existing duplicate DELETE policies on franquias
DROP POLICY IF EXISTS "franquias_delete_consolidated" ON public.franquias;
DROP POLICY IF EXISTS "franquias_delete_policy" ON public.franquias;

-- Create consolidated UPDATE policy that includes clients
CREATE POLICY "franquias_update_consolidated" ON public.franquias
FOR UPDATE
USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true 
    AND fu.papel = 'master'
  )
  OR EXISTS (
    SELECT 1 FROM cliente_depositos cd
    JOIN cliente_usuarios cu ON cu.cliente_id = cd.cliente_id
    WHERE cd.franquia_id = franquias.id 
    AND cu.user_id = auth.uid() 
    AND cu.ativo = true 
    AND cd.ativo = true
  )
)
WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true 
    AND fu.papel = 'master'
  )
  OR EXISTS (
    SELECT 1 FROM cliente_depositos cd
    JOIN cliente_usuarios cu ON cu.cliente_id = cd.cliente_id
    WHERE cd.franquia_id = franquias.id 
    AND cu.user_id = auth.uid() 
    AND cu.ativo = true 
    AND cd.ativo = true
  )
);

-- Create consolidated DELETE policy that includes clients
CREATE POLICY "franquias_delete_consolidated" ON public.franquias
FOR DELETE
USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM franquia_usuarios fu
    WHERE fu.franquia_id = franquias.id 
    AND fu.user_id = auth.uid() 
    AND fu.ativo = true 
    AND fu.papel = 'master'
  )
  OR EXISTS (
    SELECT 1 FROM cliente_depositos cd
    JOIN cliente_usuarios cu ON cu.cliente_id = cd.cliente_id
    WHERE cd.franquia_id = franquias.id 
    AND cu.user_id = auth.uid() 
    AND cu.ativo = true 
    AND cd.ativo = true
  )
);