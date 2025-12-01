-- Corrigir nomes de municípios com acentuação correta
UPDATE franquias 
SET cidade = 'Aparecida de Goiânia' 
WHERE LOWER(TRIM(cidade)) = 'aparecida de goiania';

UPDATE franquias 
SET cidade = 'Araguaína' 
WHERE LOWER(TRIM(cidade)) = 'araguaina';

UPDATE franquias 
SET cidade = 'Luís Eduardo Magalhães' 
WHERE LOWER(TRIM(cidade)) IN ('luis eduardo magalhaes', 'luís eduardo magalhaes', 'luis eduardo magalhães');

UPDATE franquias 
SET cidade = 'Ibiporã' 
WHERE LOWER(TRIM(cidade)) = 'ibipora';

UPDATE franquias 
SET cidade = 'Uberlândia' 
WHERE LOWER(TRIM(cidade)) = 'uberlandia';

-- Normalizar capitalização de Barueri
UPDATE franquias 
SET cidade = 'Barueri' 
WHERE LOWER(TRIM(cidade)) = 'barueri' AND cidade != 'Barueri';