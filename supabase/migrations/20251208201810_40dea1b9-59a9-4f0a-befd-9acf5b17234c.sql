-- Criar função RPC para buscar cliente por CPF/CNPJ
-- Esta função é SECURITY DEFINER para poder buscar clientes independente do RLS
CREATE OR REPLACE FUNCTION public.buscar_cliente_por_cpf_cnpj(p_cpf_cnpj TEXT)
RETURNS TABLE (
  id UUID,
  tipo_cliente TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  cpf_cnpj TEXT,
  inscricao_estadual TEXT,
  endereco_fiscal TEXT,
  numero_fiscal TEXT,
  complemento_fiscal TEXT,
  bairro_fiscal TEXT,
  cidade_fiscal TEXT,
  estado_fiscal TEXT,
  cep_fiscal TEXT,
  telefone_comercial TEXT,
  email_comercial TEXT,
  atividade_principal TEXT,
  regime_tributario TEXT,
  observacoes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_cpf_cnpj TEXT;
BEGIN
  -- Limpar o CPF/CNPJ removendo caracteres não numéricos
  clean_cpf_cnpj := regexp_replace(p_cpf_cnpj, '[^0-9]', '', 'g');
  
  RETURN QUERY
  SELECT 
    c.id,
    c.tipo_cliente,
    c.razao_social,
    c.nome_fantasia,
    c.cpf_cnpj,
    c.inscricao_estadual,
    c.endereco_fiscal,
    c.numero_fiscal,
    c.complemento_fiscal,
    c.bairro_fiscal,
    c.cidade_fiscal,
    c.estado_fiscal,
    c.cep_fiscal,
    c.telefone_comercial,
    c.email_comercial,
    c.atividade_principal,
    c.regime_tributario,
    c.observacoes
  FROM clientes c
  WHERE regexp_replace(c.cpf_cnpj, '[^0-9]', '', 'g') = clean_cpf_cnpj
  LIMIT 1;
END;
$$;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.buscar_cliente_por_cpf_cnpj(TEXT) TO authenticated;