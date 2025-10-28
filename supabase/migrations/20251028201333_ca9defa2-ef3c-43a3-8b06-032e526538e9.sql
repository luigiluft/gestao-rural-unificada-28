-- Adicionar foreign key constraint para fazenda_id na tabela saidas
-- Isso permitirá que o Supabase JS Client reconheça o relacionamento automaticamente

ALTER TABLE public.saidas
ADD CONSTRAINT saidas_fazenda_id_fkey 
FOREIGN KEY (fazenda_id) 
REFERENCES public.fazendas(id) 
ON DELETE SET NULL;

-- Criar índice para melhorar performance de queries com fazenda_id
CREATE INDEX IF NOT EXISTS idx_saidas_fazenda_id ON public.saidas(fazenda_id);