-- Primeiro, criar o enum para os status de aprovação
DO $$ BEGIN
    CREATE TYPE entrada_status AS ENUM (
        'aguardando_transporte',
        'em_transferencia', 
        'aguardando_conferencia',
        'conferencia_completa',
        'confirmado',
        'rejeitado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar novos campos na tabela entradas (sem o status_aprovacao ainda)
ALTER TABLE public.entradas 
ADD COLUMN IF NOT EXISTS divergencias JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS observacoes_franqueado TEXT,
ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id);

-- Adicionar a coluna status_aprovacao com o tipo correto e valor padrão
ALTER TABLE public.entradas 
ADD COLUMN IF NOT EXISTS status_aprovacao entrada_status DEFAULT 'aguardando_transporte'::entrada_status;

-- Criar tabela para histórico de mudanças de status
CREATE TABLE IF NOT EXISTS public.entrada_status_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entrada_id UUID NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
    status_anterior entrada_status,
    status_novo entrada_status NOT NULL,
    observacoes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entrada_status_historico ENABLE ROW LEVEL SECURITY;