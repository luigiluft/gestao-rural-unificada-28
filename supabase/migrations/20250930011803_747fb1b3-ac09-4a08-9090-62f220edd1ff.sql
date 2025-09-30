-- Corrigir os pallets existentes para separar avaria corretamente
-- Pallet 1 fica com apenas 10 unidades para poder ser convertido para avaria
-- Pallet 2 fica com 180 unidades normais

-- Primeiro, vamos ajustar o Pallet 1 para ser especificamente para avaria
UPDATE entrada_pallet_itens 
SET is_avaria = true
WHERE pallet_id = 'f8aa7f89-fb25-420e-ae77-bad4ede15733' 
AND entrada_item_id = '17730b01-a828-4829-a92d-e141fb702164';

-- Atualizar a descrição do Pallet 1 para indicar que é de avaria
UPDATE entrada_pallets 
SET descricao = 'Pallet 1 - Avaria'
WHERE id = 'f8aa7f89-fb25-420e-ae77-bad4ede15733';