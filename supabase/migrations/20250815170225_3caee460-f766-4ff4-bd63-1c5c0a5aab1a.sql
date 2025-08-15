-- Adicionar campo nome_produto na tabela entrada_itens para armazenar o nome correto
ALTER TABLE public.entrada_itens 
ADD COLUMN nome_produto text;