-- Deletar registros incorretos
DELETE FROM divergencias 
WHERE entrada_id IN (SELECT id FROM entradas WHERE numero_nfe = '310');

-- Inserir registros corretos
-- 1. ACEFATO: 10 unidades avariadas (usar produto_faltante para indicar perda por avaria)
INSERT INTO divergencias (
  user_id,
  deposito_id, 
  entrada_id,
  produto_id,
  tipo_origem,
  tipo_divergencia,
  quantidade_esperada,
  quantidade_encontrada,
  lote,
  observacoes,
  status,
  prioridade
)
SELECT 
  e.user_id,
  e.deposito_id,
  e.id,
  NULL,
  'entrada',
  'produto_faltante',
  200,
  190,  -- 200 - 10 avariadas = 190 úteis
  'LT20250820-02',
  'AVARIA: 10 unidades avariadas durante transporte',
  'pendente',
  'alta'
FROM entradas e 
WHERE e.numero_nfe = '310';

-- 2. SAFENITH: 20 litros a menos (380 em vez de 400)
INSERT INTO divergencias (
  user_id,
  deposito_id,
  entrada_id, 
  produto_id,
  tipo_origem,
  tipo_divergencia,
  quantidade_esperada,
  quantidade_encontrada,
  lote,
  observacoes,
  status,
  prioridade
)
SELECT 
  e.user_id,
  e.deposito_id,
  e.id,
  NULL,
  'entrada',
  'quantidade_incorreta',
  400,
  380,  -- quantidade recebida
  'LT20250820-01',
  'Quantidade recebida menor que esperada: faltam 20 litros',
  'pendente',
  'media'
FROM entradas e 
WHERE e.numero_nfe = '310';