
-- Corrigir Security Definer View removendo security definer
DROP VIEW IF EXISTS franquia_usuarios_backup;

-- Recriar sem SECURITY DEFINER (views são SECURITY INVOKER por padrão)
CREATE VIEW franquia_usuarios_backup 
WITH (security_invoker = true) 
AS SELECT * FROM franquia_usuarios;

COMMENT ON VIEW franquia_usuarios_backup IS 'Backup da tabela franquia_usuarios - migração para cliente_depositos';
