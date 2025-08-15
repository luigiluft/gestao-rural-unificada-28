-- Add CASCADE delete to produtos foreign keys

-- Drop existing foreign key constraints if they exist
ALTER TABLE entrada_itens DROP CONSTRAINT IF EXISTS entrada_itens_produto_id_fkey;
ALTER TABLE saida_itens DROP CONSTRAINT IF EXISTS saida_itens_produto_id_fkey;
ALTER TABLE estoque DROP CONSTRAINT IF EXISTS estoque_produto_id_fkey;
ALTER TABLE movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_produto_id_fkey;

-- Add new foreign key constraints with CASCADE delete
ALTER TABLE entrada_itens 
ADD CONSTRAINT entrada_itens_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

ALTER TABLE saida_itens 
ADD CONSTRAINT saida_itens_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

ALTER TABLE estoque 
ADD CONSTRAINT estoque_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

ALTER TABLE movimentacoes 
ADD CONSTRAINT movimentacoes_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;