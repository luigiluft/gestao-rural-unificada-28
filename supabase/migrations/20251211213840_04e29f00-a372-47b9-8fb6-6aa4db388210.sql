-- Update the trigger function to create a new deposit for new companies
-- instead of reusing an existing franchise

CREATE OR REPLACE FUNCTION public.criar_deposito_padrao_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  nova_franquia_id UUID;
  codigo_deposito TEXT;
BEGIN
  -- Generate unique deposit code
  codigo_deposito := 'DEP-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  -- Create new franchise (physical warehouse) for the company
  -- using the address data from the newly created company
  INSERT INTO public.franquias (
    nome,
    codigo_interno,
    cidade,
    estado,
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cnpj,
    telefone,
    email,
    tipo_deposito,
    ativo
  ) VALUES (
    COALESCE(NEW.nome_fantasia, NEW.razao_social) || ' - Matriz',
    codigo_deposito,
    NEW.cidade_fiscal,
    NEW.estado_fiscal,
    NEW.cep_fiscal,
    NEW.endereco_fiscal,
    NEW.numero_fiscal,
    NEW.complemento_fiscal,
    NEW.bairro_fiscal,
    NEW.cpf_cnpj,
    NEW.telefone_comercial,
    NEW.email_comercial,
    'matriz',
    true
  )
  RETURNING id INTO nova_franquia_id;
  
  -- Link the client to its new deposit
  INSERT INTO public.cliente_depositos (
    cliente_id,
    franquia_id,
    tipo_regime,
    nome,
    codigo_interno,
    ativo,
    created_by
  ) VALUES (
    NEW.id,
    nova_franquia_id,
    'filial',
    COALESCE(NEW.nome_fantasia, NEW.razao_social) || ' - Depósito Matriz',
    codigo_deposito,
    true,
    NEW.created_by
  );
  
  -- Link the company creator as master user of the franchise
  -- Only if created_by is not null
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.franquia_usuarios (
      franquia_id,
      user_id,
      papel,
      ativo,
      created_by
    ) VALUES (
      nova_franquia_id,
      NEW.created_by,
      'master',
      true,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;