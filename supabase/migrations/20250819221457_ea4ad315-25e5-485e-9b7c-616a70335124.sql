-- Add missing foreign keys for allocation tables
ALTER TABLE allocation_wave_items 
ADD CONSTRAINT fk_allocation_wave_items_wave_id 
FOREIGN KEY (wave_id) REFERENCES allocation_waves(id) ON DELETE CASCADE;

ALTER TABLE allocation_wave_items 
ADD CONSTRAINT fk_allocation_wave_items_entrada_item_id 
FOREIGN KEY (entrada_item_id) REFERENCES entrada_itens(id) ON DELETE CASCADE;

ALTER TABLE allocation_wave_items 
ADD CONSTRAINT fk_allocation_wave_items_produto_id 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

ALTER TABLE allocation_wave_items 
ADD CONSTRAINT fk_allocation_wave_items_posicao_id 
FOREIGN KEY (posicao_id) REFERENCES storage_positions(id) ON DELETE SET NULL;

ALTER TABLE allocation_waves 
ADD CONSTRAINT fk_allocation_waves_deposito_id 
FOREIGN KEY (deposito_id) REFERENCES franquias(id) ON DELETE CASCADE;