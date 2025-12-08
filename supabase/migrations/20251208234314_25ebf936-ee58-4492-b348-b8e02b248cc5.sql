-- Função para criar depósito padrão ao criar uma empresa/cliente
CREATE OR REPLACE FUNCTION public.criar_deposito_padrao_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  franquia_padrao_id UUID;
BEGIN
  -- Buscar uma franquia ativa para hospedar o depósito inicial
  -- (pode ser a primeira franquia disponível ou uma franquia padrão do sistema)
  SELECT id INTO franquia_padrao_id
  FROM public.franquias
  WHERE ativo = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Se não houver franquia disponível, não criar depósito
  IF franquia_padrao_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Criar depósito padrão para o novo cliente
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
    franquia_padrao_id,
    'armazem_geral',
    COALESCE(NEW.nome_fantasia, NEW.razao_social) || ' - Depósito Principal',
    'DEP-' || SUBSTRING(NEW.id::TEXT, 1, 8),
    true,
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger para criar depósito automaticamente
DROP TRIGGER IF EXISTS trigger_criar_deposito_padrao ON public.clientes;
CREATE TRIGGER trigger_criar_deposito_padrao
  AFTER INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_deposito_padrao_cliente();

-- Criar depósitos para clientes existentes que não têm nenhum
DO $$
DECLARE
  cliente_rec RECORD;
  franquia_padrao_id UUID;
BEGIN
  -- Buscar franquia padrão
  SELECT id INTO franquia_padrao_id
  FROM public.franquias
  WHERE ativo = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF franquia_padrao_id IS NULL THEN
    RAISE NOTICE 'Nenhuma franquia ativa encontrada para criar depósitos padrão';
    RETURN;
  END IF;
  
  -- Para cada cliente sem depósito, criar um
  FOR cliente_rec IN 
    SELECT c.id, c.razao_social, c.nome_fantasia, c.created_by
    FROM public.clientes c
    WHERE c.ativo = true
    AND NOT EXISTS (
      SELECT 1 FROM public.cliente_depositos cd 
      WHERE cd.cliente_id = c.id AND cd.ativo = true
    )
  LOOP
    INSERT INTO public.cliente_depositos (
      cliente_id,
      franquia_id,
      tipo_regime,
      nome,
      codigo_interno,
      ativo,
      created_by
    ) VALUES (
      cliente_rec.id,
      franquia_padrao_id,
      'armazem_geral',
      COALESCE(cliente_rec.nome_fantasia, cliente_rec.razao_social) || ' - Depósito Principal',
      'DEP-' || SUBSTRING(cliente_rec.id::TEXT, 1, 8),
      true,
      cliente_rec.created_by
    );
  END LOOP;
END;
$$;