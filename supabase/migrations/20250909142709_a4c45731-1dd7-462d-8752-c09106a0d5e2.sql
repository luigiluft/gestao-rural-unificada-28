-- Adicionar coluna produtor_destinatario_id na tabela saidas
ALTER TABLE public.saidas 
ADD COLUMN produtor_destinatario_id UUID REFERENCES auth.users(id);

-- Comentário explicativo da coluna
COMMENT ON COLUMN public.saidas.produtor_destinatario_id IS 'ID do usuário produtor destinatário da saída. Para produtores é o próprio user_id, para franqueados/admins é o produtor selecionado';