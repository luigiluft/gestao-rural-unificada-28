-- Migração para consolidar campos de destinatário: produtor_destinatario_id → cliente_destinatario_id
-- Para saídas que têm produtor_destinatario_id mas não têm cliente_destinatario_id,
-- buscar o cliente associado ao usuário e preencher

-- 1. Atualizar saídas existentes que usam produtor_destinatario_id
UPDATE saidas s
SET cliente_destinatario_id = (
  SELECT cu.cliente_id 
  FROM cliente_usuarios cu 
  WHERE cu.user_id = s.produtor_destinatario_id 
  AND cu.ativo = true 
  LIMIT 1
)
WHERE s.cliente_destinatario_id IS NULL 
AND s.produtor_destinatario_id IS NOT NULL;

-- 2. Se cliente_usuarios não tem registro, tentar via profile.cpf_cnpj
UPDATE saidas s
SET cliente_destinatario_id = (
  SELECT c.id 
  FROM clientes c
  JOIN profiles p ON p.cpf_cnpj = c.cpf_cnpj
  WHERE p.user_id = s.produtor_destinatario_id 
  AND c.ativo = true 
  LIMIT 1
)
WHERE s.cliente_destinatario_id IS NULL 
AND s.produtor_destinatario_id IS NOT NULL;