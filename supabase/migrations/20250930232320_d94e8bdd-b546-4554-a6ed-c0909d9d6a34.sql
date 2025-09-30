-- Function to compare entrada emitente/destinatario with the auth user's CPF/CNPJ (ignoring punctuation)
CREATE OR REPLACE FUNCTION public.matches_auth_user_cpf_cnpj(_emitente text, _destinatario text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH u AS (
    SELECT regexp_replace(COALESCE(p.cpf_cnpj, ''), '[^0-9]', '', 'g') AS cpf
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1 FROM u
    WHERE cpf <> '' AND (
      regexp_replace(COALESCE(_emitente, ''), '[^0-9]', '', 'g') = cpf
      OR regexp_replace(COALESCE(_destinatario, ''), '[^0-9]', '', 'g') = cpf
    )
  );
$$;

-- Allow producers to see entradas where CPF/CNPJ matches their profile (either as emitente or destinatario)
DROP POLICY IF EXISTS "Producers can view entradas by cpf_cnpj match" ON public.entradas;
CREATE POLICY "Producers can view entradas by cpf_cnpj match"
ON public.entradas
FOR SELECT
USING (
  has_role(auth.uid(), 'produtor'::app_role)
  AND public.matches_auth_user_cpf_cnpj(emitente_cnpj, destinatario_cpf_cnpj)
);

-- Ensure producers can also see entrada_itens for those entradas
DROP POLICY IF EXISTS "Producers can view entrada_itens by parent cpf_cnpj match" ON public.entrada_itens;
CREATE POLICY "Producers can view entrada_itens by parent cpf_cnpj match"
ON public.entrada_itens
FOR SELECT
USING (
  has_role(auth.uid(), 'produtor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.entradas e
    WHERE e.id = entrada_itens.entrada_id
      AND public.matches_auth_user_cpf_cnpj(e.emitente_cnpj, e.destinatario_cpf_cnpj)
  )
);
