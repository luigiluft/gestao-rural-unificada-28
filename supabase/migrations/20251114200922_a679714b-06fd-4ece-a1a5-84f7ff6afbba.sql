-- Migração de dados de profiles para clientes
-- Criar clientes a partir dos profiles existentes que têm dados de empresa

INSERT INTO public.clientes (
  tipo_cliente,
  razao_social,
  nome_fantasia,
  cpf_cnpj,
  inscricao_estadual,
  endereco_fiscal,
  cidade_fiscal,
  estado_fiscal,
  cep_fiscal,
  telefone_comercial,
  email_comercial,
  atividade_principal,
  observacoes,
  created_by,
  ativo
)
SELECT 
  CASE 
    WHEN p.is_produtor_rural = true THEN 'produtor_rural'::TEXT
    ELSE 'empresa'::TEXT
  END as tipo_cliente,
  COALESCE(NULLIF(p.razao_social, ''), p.nome) as razao_social,
  p.nome as nome_fantasia,
  COALESCE(NULLIF(p.cnpj_empresa, ''), p.cpf_cnpj, '') as cpf_cnpj,
  p.inscricao_estadual,
  p.endereco as endereco_fiscal,
  p.cidade as cidade_fiscal,
  p.estado as estado_fiscal,
  p.cep as cep_fiscal,
  COALESCE(p.telefone_comercial, p.telefone) as telefone_comercial,
  p.email as email_comercial,
  p.atividade_principal,
  p.observacoes_empresa as observacoes,
  p.user_id as created_by,
  true as ativo
FROM public.profiles p
WHERE 
  -- Só migrar se tiver CNPJ ou CPF e for produtor ou franqueado
  (p.cnpj_empresa IS NOT NULL AND p.cnpj_empresa != '')
  OR (p.cpf_cnpj IS NOT NULL AND p.cpf_cnpj != '')
  AND p.role IN ('produtor', 'franqueado')
  -- Evitar duplicatas
  AND NOT EXISTS (
    SELECT 1 FROM public.clientes c 
    WHERE c.cpf_cnpj = COALESCE(NULLIF(p.cnpj_empresa, ''), p.cpf_cnpj)
  );

-- Criar relacionamento automático entre usuários e seus clientes migrados
-- Vincular cada usuário ao cliente criado a partir de seu profile
INSERT INTO public.cliente_usuarios (
  cliente_id,
  user_id,
  papel,
  created_by,
  ativo
)
SELECT 
  c.id as cliente_id,
  p.user_id as user_id,
  'administrador'::TEXT as papel,
  p.user_id as created_by,
  true as ativo
FROM public.profiles p
JOIN public.clientes c ON (
  c.cpf_cnpj = COALESCE(NULLIF(p.cnpj_empresa, ''), p.cpf_cnpj)
  AND c.created_by = p.user_id
)
WHERE p.role IN ('produtor', 'franqueado')
  -- Evitar duplicatas
  AND NOT EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.cliente_id = c.id AND cu.user_id = p.user_id
  );

-- Comentário explicativo
COMMENT ON TABLE public.clientes IS 'Tabela de clientes migrados de profiles. Separação entre pessoa física (usuário) e entidade fiscal (cliente).';