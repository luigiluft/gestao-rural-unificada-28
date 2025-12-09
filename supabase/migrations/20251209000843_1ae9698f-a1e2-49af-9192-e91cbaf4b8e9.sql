-- Criar franquia/depósito para o cliente Andre Maia
INSERT INTO franquias (
  nome,
  cnpj,
  tipo_deposito,
  ativo,
  cidade,
  estado
) VALUES (
  'Revenda do André Ltda',
  '59.179.886/0001-25',
  'filial',
  true,
  'São Paulo',
  'SP'
);

-- Associar o depósito do cliente à nova franquia criada
UPDATE cliente_depositos 
SET franquia_id = (SELECT id FROM franquias WHERE cnpj = '59.179.886/0001-25' LIMIT 1)
WHERE cliente_id = '8cac35cc-f466-42fb-a311-8c35d24927e0';