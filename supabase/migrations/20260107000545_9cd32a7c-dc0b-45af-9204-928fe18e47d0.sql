-- Adicionar 'pendente_aprovacao' ao enum entrada_status
ALTER TYPE entrada_status ADD VALUE 'pendente_aprovacao' BEFORE 'aguardando_transporte';