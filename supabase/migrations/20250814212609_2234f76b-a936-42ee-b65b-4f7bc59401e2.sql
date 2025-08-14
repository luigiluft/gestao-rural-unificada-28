-- Allow deposito_id to be nullable temporarily for manual entries
ALTER TABLE entradas ALTER COLUMN deposito_id DROP NOT NULL;

-- Allow produto_id to be nullable temporarily for manual entries  
ALTER TABLE entrada_itens ALTER COLUMN produto_id DROP NOT NULL;