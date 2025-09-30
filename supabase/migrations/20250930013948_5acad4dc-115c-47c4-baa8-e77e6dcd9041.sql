-- Fix NFe 310 emitente_cnpj to match the producer's CPF
-- Based on the emitente_nome "LUCCA LUFT LTDA", this should be linked to the producer
UPDATE entradas 
SET emitente_cnpj = '07722223884'
WHERE numero_nfe = '310' 
  AND emitente_nome = 'LUCCA LUFT LTDA'
  AND emitente_cnpj IS NULL;

-- Create a function to validate and fix missing emitente/destinatario data during NFe import
CREATE OR REPLACE FUNCTION public.validate_entrada_cnpj_data()
RETURNS TRIGGER AS $$
BEGIN
  -- If emitente_cnpj is missing but emitente_nome exists, try to find matching producer
  IF NEW.emitente_cnpj IS NULL AND NEW.emitente_nome IS NOT NULL THEN
    -- Try to find a producer profile that matches the emitente name pattern
    SELECT cpf_cnpj INTO NEW.emitente_cnpj
    FROM profiles p
    WHERE p.role = 'produtor'
      AND p.ativo = true
      AND (
        UPPER(TRIM(p.nome)) ILIKE '%' || UPPER(TRIM(split_part(NEW.emitente_nome, ' ', 1))) || '%'
        OR UPPER(TRIM(p.nome)) ILIKE '%' || UPPER(TRIM(split_part(NEW.emitente_nome, ' ', 2))) || '%'
      )
    LIMIT 1;
  END IF;
  
  -- Log warning if critical fields are still missing
  IF NEW.emitente_cnpj IS NULL AND NEW.destinatario_cpf_cnpj IS NULL THEN
    RAISE WARNING 'NFe % inserted without emitente_cnpj or destinatario_cpf_cnpj - producer may not be able to view', NEW.numero_nfe;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;