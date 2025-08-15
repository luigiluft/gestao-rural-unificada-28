-- Adicionar campos da NFe na tabela entradas
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS serie TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS natureza_operacao TEXT;

-- Adicionar campos do fornecedor na tabela fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;

-- Criar trigger para atualizar updated_at na tabela entradas
CREATE TRIGGER update_entradas_updated_at
    BEFORE UPDATE ON public.entradas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();