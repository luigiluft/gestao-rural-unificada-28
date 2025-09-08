-- Debug: Add a function to search for producers that bypasses RLS for franqueados
-- This function will be used during XML import to allow franqueados to find producers

CREATE OR REPLACE FUNCTION public.find_produtor_for_import(
  _cpf_cnpj text,
  _requesting_user_id uuid
) RETURNS TABLE(
  user_id uuid,
  nome text,
  email text, 
  cpf_cnpj text,
  role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cpf_cnpj_limpo text;
  _cpf_cnpj_com_mascara text;
BEGIN
  -- Clean the CPF/CNPJ
  _cpf_cnpj_limpo := regexp_replace(_cpf_cnpj, '[^\d]', '', 'g');
  
  -- Format with mask
  IF length(_cpf_cnpj_limpo) = 11 THEN
    -- CPF format
    _cpf_cnpj_com_mascara := regexp_replace(_cpf_cnpj_limpo, '^(\d{3})(\d{3})(\d{3})(\d{2})$', '\1.\2.\3-\4');
  ELSIF length(_cpf_cnpj_limpo) = 14 THEN
    -- CNPJ format  
    _cpf_cnpj_com_mascara := regexp_replace(_cpf_cnpj_limpo, '^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$', '\1.\2.\3/\4-\5');
  ELSE
    -- Invalid length
    RETURN;
  END IF;
  
  -- Search for producer with both formats
  RETURN QUERY
  SELECT p.user_id, p.nome, p.email, p.cpf_cnpj, p.role
  FROM profiles p
  WHERE p.role = 'produtor'::app_role
  AND (
    p.cpf_cnpj = _cpf_cnpj_limpo 
    OR p.cpf_cnpj = _cpf_cnpj_com_mascara
  )
  LIMIT 1;
END;
$$;

-- Add debugging to see what's happening with RLS
-- Let's also add some logging to the existing RLS policy