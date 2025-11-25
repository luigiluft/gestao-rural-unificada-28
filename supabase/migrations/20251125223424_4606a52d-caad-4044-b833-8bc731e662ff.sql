-- Migrate data from fazendas to locais_entrega
INSERT INTO public.locais_entrega (
  id, cliente_id, produtor_id, nome, tipo_local, is_rural, ativo,
  endereco, numero, complemento, bairro, cidade, estado, cep,
  latitude, longitude, inscricao_estadual, telefone_contato, email_contato,
  tipo_logradouro, nome_logradouro, municipio, codigo_ibge_municipio, uf, uf_ie, referencia,
  cpf_cnpj_proprietario, situacao_cadastral, codigo_imovel_rural, cadastro_ambiental_rural,
  area_total_ha, tipo_producao, capacidade_armazenagem_ton, infraestrutura, nome_responsavel, created_at
)
SELECT
  f.id, 
  COALESCE(f.cliente_id, (SELECT c.id FROM clientes c WHERE c.cpf_cnpj = f.cpf_cnpj_proprietario LIMIT 1)) as cliente_id,
  f.produtor_id, 
  f.nome,
  'fazenda'::tipo_local,
  true as is_rural,
  COALESCE(f.ativo, true) as ativo,
  COALESCE(f.endereco, 'Endereço não informado') as endereco,
  f.numero,
  f.complemento,
  f.bairro,
  COALESCE(f.cidade, f.municipio, 'Cidade não informada') as cidade,
  COALESCE(f.estado, f.uf, 'Estado não informado') as estado,
  COALESCE(f.cep, '00000-000') as cep,
  f.latitude,
  f.longitude,
  f.inscricao_estadual,
  f.telefone_contato,
  f.email_contato,
  f.tipo_logradouro,
  f.nome_logradouro,
  f.municipio,
  f.codigo_ibge_municipio,
  f.uf,
  f.uf_ie,
  f.referencia,
  f.cpf_cnpj_proprietario,
  f.situacao_cadastral,
  f.codigo_imovel_rural,
  f.cadastro_ambiental_rural,
  f.area_total_ha,
  f.tipo_producao,
  f.capacidade_armazenagem_ton,
  f.infraestrutura,
  f.nome_responsavel,
  f.created_at
FROM public.fazendas f
WHERE f.id NOT IN (SELECT id FROM public.locais_entrega)
ON CONFLICT (id) DO NOTHING;

-- Update saidas to use local_entrega_id
UPDATE public.saidas 
SET local_entrega_id = fazenda_id 
WHERE fazenda_id IS NOT NULL AND local_entrega_id IS NULL;

COMMENT ON COLUMN public.saidas.local_entrega_id IS 'References locais_entrega table - replaces fazenda_id';