-- Criar função RPC para buscar clientes vinculados a uma empresa
-- Esta função é SECURITY DEFINER para poder buscar clientes independente do RLS
CREATE OR REPLACE FUNCTION public.buscar_empresa_clientes(p_empresa_id UUID)
RETURNS TABLE (
  id UUID,
  empresa_id UUID,
  cliente_id UUID,
  tipo_relacionamento TEXT,
  observacoes TEXT,
  ativo BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  cliente_razao_social TEXT,
  cliente_nome_fantasia TEXT,
  cliente_cpf_cnpj TEXT,
  cliente_tipo TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_cidade TEXT,
  cliente_estado TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.empresa_id,
    ec.cliente_id,
    ec.tipo_relacionamento,
    ec.observacoes,
    ec.ativo,
    ec.created_at,
    ec.updated_at,
    ec.created_by,
    c.razao_social,
    c.nome_fantasia,
    c.cpf_cnpj,
    c.tipo_cliente,
    c.email_comercial,
    c.telefone_comercial,
    c.cidade_fiscal,
    c.estado_fiscal
  FROM empresa_clientes ec
  INNER JOIN clientes c ON c.id = ec.cliente_id
  WHERE ec.empresa_id = p_empresa_id
  AND ec.ativo = true
  ORDER BY ec.created_at DESC;
END;
$$;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.buscar_empresa_clientes(UUID) TO authenticated;