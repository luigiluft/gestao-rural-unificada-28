
-- =====================================================
-- FASE 7: Migração de franquia_usuarios para cliente_depositos
-- =====================================================

-- 1. Criar cliente_depositos para usuários que têm cliente mas não têm depósito
INSERT INTO cliente_depositos (cliente_id, franquia_id, nome, tipo_regime, ativo)
SELECT DISTINCT
  cu.cliente_id,
  fu.franquia_id,
  f.nome || ' - ' || COALESCE(c.nome_fantasia, c.razao_social),
  'armazem_geral',
  true
FROM franquia_usuarios fu
INNER JOIN profiles p ON fu.user_id = p.user_id
INNER JOIN cliente_usuarios cu ON fu.user_id = cu.user_id AND cu.ativo = true
INNER JOIN franquias f ON fu.franquia_id = f.id
INNER JOIN clientes c ON cu.cliente_id = c.id
WHERE fu.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM cliente_depositos cd 
    WHERE cd.cliente_id = cu.cliente_id 
      AND cd.franquia_id = fu.franquia_id
  );

-- 2. Criar backup view da tabela franquia_usuarios antes de desativar
CREATE OR REPLACE VIEW franquia_usuarios_backup AS
SELECT * FROM franquia_usuarios;

-- 3. Adicionar comment para documentar migração
COMMENT ON VIEW franquia_usuarios_backup IS 'Backup da tabela franquia_usuarios - migração para cliente_depositos';
