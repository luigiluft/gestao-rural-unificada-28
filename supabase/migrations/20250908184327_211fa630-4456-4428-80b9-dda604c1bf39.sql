-- Allow franqueados to import XML when delivery CNPJ matches their franquia

-- 1. Create helper function to check if a franqueado can act for a delivery CNPJ
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
      UPPER(TRIM(COALESCE(f.cnpj, ''))) = UPPER(TRIM(COALESCE(_delivery_cnpj, '')))
      OR UPPER(TRIM(COALESCE(f.cnpj, ''))) = UPPER(TRIM(COALESCE(regexp_replace(_delivery_cnpj, '[^\d]', '', 'g'), '')))
    )
  );
$$;

-- 2. Update fornecedores INSERT policy to allow franqueados
DROP POLICY IF EXISTS "Insert own rows or admin can insert for any user" ON public.fornecedores;
CREATE POLICY "Insert own rows or admin/franqueado can insert for any user" 
ON public.fornecedores 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'franqueado'::app_role)
);

-- 3. Update entradas INSERT policy to allow franqueados when deposito is their franquia
DROP POLICY IF EXISTS "Insert own rows" ON public.entradas;
CREATE POLICY "Insert own rows or admin/franqueado can insert" 
ON public.entradas 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND deposito_id IN (
      SELECT f.id FROM public.franquias f 
      WHERE f.master_franqueado_id = auth.uid() AND f.ativo = true
    )
  )
);

-- 4. Update entrada_itens INSERT policy to allow franqueados when entrada is in their franquia
DROP POLICY IF EXISTS "Insert own rows" ON public.entrada_itens;
CREATE POLICY "Insert own rows or admin/franqueado can insert" 
ON public.entrada_itens 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.entradas e
      JOIN public.franquias f ON f.id = e.deposito_id
      WHERE e.id = entrada_itens.entrada_id
      AND f.master_franqueado_id = auth.uid()
      AND f.ativo = true
    )
  )
);