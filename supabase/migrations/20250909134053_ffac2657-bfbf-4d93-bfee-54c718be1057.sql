-- Add approval workflow fields to saidas table
ALTER TABLE public.saidas ADD COLUMN IF NOT EXISTS criado_por_franqueado boolean DEFAULT false;
ALTER TABLE public.saidas ADD COLUMN IF NOT EXISTS status_aprovacao_produtor text DEFAULT 'nao_aplicavel';
ALTER TABLE public.saidas ADD COLUMN IF NOT EXISTS data_aprovacao_produtor timestamp with time zone;
ALTER TABLE public.saidas ADD COLUMN IF NOT EXISTS observacoes_aprovacao text;

-- Create index for better performance on approval queries
CREATE INDEX IF NOT EXISTS idx_saidas_aprovacao_produtor ON public.saidas(user_id, status_aprovacao_produtor, criado_por_franqueado);

-- Update existing saidas to have the default values
UPDATE public.saidas 
SET criado_por_franqueado = false, 
    status_aprovacao_produtor = 'nao_aplicavel'
WHERE criado_por_franqueado IS NULL OR status_aprovacao_produtor IS NULL;