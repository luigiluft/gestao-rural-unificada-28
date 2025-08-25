-- Atualizar entradas existentes que estão em conferencia_completa para planejamento
UPDATE entradas 
SET status_aprovacao = 'planejamento'::entrada_status 
WHERE status_aprovacao = 'conferencia_completa'::entrada_status;