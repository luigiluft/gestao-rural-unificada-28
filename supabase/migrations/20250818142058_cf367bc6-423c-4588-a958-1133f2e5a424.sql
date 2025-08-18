-- Add missing fields to franquias table for comprehensive franchise management

-- Add new columns for detailed franchise information
ALTER TABLE public.franquias 
ADD COLUMN IF NOT EXISTS codigo_interno TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS layout_armazem TEXT;

-- Add unique constraint for codigo_interno to prevent duplicates
ALTER TABLE public.franquias 
ADD CONSTRAINT unique_codigo_interno UNIQUE (codigo_interno);

-- Create index for better performance on searches
CREATE INDEX IF NOT EXISTS idx_franquias_codigo_interno ON public.franquias(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_franquias_cnpj ON public.franquias(cnpj);
CREATE INDEX IF NOT EXISTS idx_franquias_cidade_estado ON public.franquias(cidade, estado);