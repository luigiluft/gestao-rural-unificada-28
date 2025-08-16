-- Atualizar NFe 312 para status aguardando_transporte
UPDATE entradas 
SET status_aprovacao = 'aguardando_transporte'::entrada_status 
WHERE numero_nfe = '312';