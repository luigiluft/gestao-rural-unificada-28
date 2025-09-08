-- Fix RLS policies to allow franqueados to import XML when delivery CNPJ matches their franquia

-- 1. Add RLS policy to allow franqueados to view producer profiles in their hierarchy
CREATE POLICY "Franqueados can view producer profiles in their hierarchy" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND role = 'produtor'::app_role
  AND EXISTS (
    SELECT 1 FROM public.user_hierarchy uh
    WHERE uh.child_user_id = profiles.user_id 
    AND uh.parent_user_id = auth.uid()
  )
);

-- 2. Improve the CNPJ comparison function to handle both masked and unmasked formats better
CREATE OR REPLACE FUNCTION public.can_franqueado_import_for_delivery(
  _franqueado_id uuid, 
  _delivery_cnpj text
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.franquias f
    WHERE f.master_franqueado_id = _franqueado_id
    AND f.ativo = true
    AND (
      -- Compare with original CNPJ
      UPPER(TRIM(COALESCE(f.cnpj, ''))) = UPPER(TRIM(COALESCE(_delivery_cnpj, '')))
      -- Compare cleaned CNPJ with cleaned delivery CNPJ  
      OR UPPER(TRIM(COALESCE(regexp_replace(f.cnpj, '[^\d]', '', 'g'), ''))) = UPPER(TRIM(COALESCE(regexp_replace(_delivery_cnpj, '[^\d]', '', 'g'), '')))
      -- Compare original CNPJ with cleaned delivery CNPJ
      OR UPPER(TRIM(COALESCE(f.cnpj, ''))) = UPPER(TRIM(COALESCE(regexp_replace(_delivery_cnpj, '[^\d]', '', 'g'), '')))
      -- Compare cleaned CNPJ with original delivery CNPJ
      OR UPPER(TRIM(COALESCE(regexp_replace(f.cnpj, '[^\d]', '', 'g'), ''))) = UPPER(TRIM(COALESCE(_delivery_cnpj, '')))
    )
  );
$$;