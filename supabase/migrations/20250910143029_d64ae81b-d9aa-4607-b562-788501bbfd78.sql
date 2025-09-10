-- Atualizar todas as posições existentes para usar tipo 'pallet'
UPDATE storage_positions 
SET tipo_posicao = 'pallet' 
WHERE tipo_posicao = 'prateleira';

-- Comentário: Padronizando tipo_posicao para usar apenas 'pallet' ao invés de 'prateleira'