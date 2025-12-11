-- Fix the trigger function to use 'franquia' instead of 'matriz'
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
    'franquia',  -- Changed from 'matriz' to 'franquia' (valid enum value)
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

-- Now create the correct deposit for Miguelito Corp

-- 1. Delete the incorrect cliente_deposito
DELETE FROM public.cliente_depositos 
WHERE id = '1c086040-0097-434b-82bc-4e78c0f97dcb';

-- 2. Create the correct franquia with 'franquia' tipo_deposito
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
    'Miguelito Corp - Matriz',
    'DEP-a06c510a',
    'Barueri',
    'SP',
    '06449-090',
    'Rua Jambolão',
    '131',
    'S/C',
    'Parque Viana',
    '35.757.799/0001-40',
    '11957441010',
    'lucca+13@luft.com.br',
    'franquia',
    true
);

-- 3. Link the client to the new deposit
INSERT INTO public.cliente_depositos (
    cliente_id,
    franquia_id,
    tipo_regime,
    nome,
    codigo_interno,
    ativo,
    created_by
)
SELECT 
    'a06c510a-895d-413a-b3a8-1aa384c9ceca',
    f.id,
    'filial',
    'Miguelito Corp - Depósito Matriz',
    'DEP-a06c510a',
    true,
    'ea04a670-5fd6-46f6-b36e-50f7f73925eb'
FROM public.franquias f
WHERE f.codigo_interno = 'DEP-a06c510a';

-- 4. Add the creator as master user
INSERT INTO public.franquia_usuarios (
    franquia_id,
    user_id,
    papel,
    ativo,
    created_by
)
SELECT 
    f.id,
    'ea04a670-5fd6-46f6-b36e-50f7f73925eb',
    'master',
    true,
    'ea04a670-5fd6-46f6-b36e-50f7f73925eb'
FROM public.franquias f
WHERE f.codigo_interno = 'DEP-a06c510a';