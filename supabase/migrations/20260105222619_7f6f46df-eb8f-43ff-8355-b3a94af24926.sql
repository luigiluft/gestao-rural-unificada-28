-- PARTE 3: Migrar saídas existentes - preencher cliente_origem_id onde está NULL
-- Atualizar saídas que têm deposito_id mas não têm cliente_origem_id

UPDATE saidas s
SET cliente_origem_id = (
  SELECT c.id 
  FROM clientes c
  JOIN franquias f ON f.cnpj = c.cpf_cnpj OR REPLACE(f.cnpj, '.', '') = REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', '') OR REPLACE(REPLACE(REPLACE(f.cnpj, '.', ''), '/', ''), '-', '') = REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '/', ''), '-', '')
  WHERE f.id = s.deposito_id
  AND c.ativo = true
  LIMIT 1
)
WHERE s.cliente_origem_id IS NULL 
AND s.deposito_id IS NOT NULL;