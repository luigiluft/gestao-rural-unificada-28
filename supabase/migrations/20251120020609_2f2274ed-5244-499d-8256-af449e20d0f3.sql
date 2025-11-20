-- Renomear coluna inscricao_estadual para inscricao_municipal na tabela franquias
ALTER TABLE public.franquias 
RENAME COLUMN inscricao_estadual TO inscricao_municipal;

-- Atualizar comentário da coluna
COMMENT ON COLUMN public.franquias.inscricao_municipal IS 'Inscrição Municipal do depósito/franquia';