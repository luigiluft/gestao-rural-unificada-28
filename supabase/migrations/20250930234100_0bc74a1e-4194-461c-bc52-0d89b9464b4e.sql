-- Allow producers (destinatários) to delete entradas where their CPF/CNPJ matches
DROP POLICY IF EXISTS "Destinatário can delete their entradas" ON public.entradas;
CREATE POLICY "Destinatário can delete their entradas"
ON public.entradas
FOR DELETE
USING (
  has_role(auth.uid(), 'produtor'::app_role)
  AND public.matches_auth_user_cpf_cnpj(emitente_cnpj, destinatario_cpf_cnpj)
);

-- Allow producers (destinatários) to update entradas where their CPF/CNPJ matches
DROP POLICY IF EXISTS "Destinatário can update their entradas" ON public.entradas;
CREATE POLICY "Destinatário can update their entradas"
ON public.entradas
FOR UPDATE
USING (
  has_role(auth.uid(), 'produtor'::app_role)
  AND public.matches_auth_user_cpf_cnpj(emitente_cnpj, destinatario_cpf_cnpj)
);