-- Migração para criar locais de entrega "Matriz" para clientes existentes que têm endereço fiscal mas não têm local de entrega

INSERT INTO public.locais_entrega (
  nome,
  tipo_local,
  is_rural,
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  cliente_id,
  ativo
)
SELECT 
  CONCAT('Matriz - ', COALESCE(c.nome_fantasia, c.razao_social)) as nome,
  'filial' as tipo_local,
  false as is_rural,
  CONCAT_WS(', ', c.endereco_fiscal, c.numero_fiscal, c.complemento_fiscal) as endereco,
  COALESCE(c.bairro_fiscal, '') as bairro,
  c.cidade_fiscal as cidade,
  c.estado_fiscal as estado,
  COALESCE(c.cep_fiscal, '') as cep,
  c.id as cliente_id,
  true as ativo
FROM public.clientes c
WHERE c.endereco_fiscal IS NOT NULL 
  AND c.cidade_fiscal IS NOT NULL 
  AND c.estado_fiscal IS NOT NULL
  AND c.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.locais_entrega le 
    WHERE le.cliente_id = c.id AND le.ativo = true
  );