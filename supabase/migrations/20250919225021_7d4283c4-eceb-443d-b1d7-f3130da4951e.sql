-- Criar tabela de ocorrências
CREATE TABLE public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('acidente', 'avaria', 'atraso', 'roubo', 'outros')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  viagem_id UUID REFERENCES public.viagens(id),
  veiculo TEXT,
  motorista TEXT,
  localizacao TEXT,
  data_ocorrencia TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_por TEXT,
  responsavel TEXT,
  observacoes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own ocorrencias or as admin/franqueado"
ON public.ocorrencias FOR SELECT
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'franqueado'::app_role)
);

CREATE POLICY "Users can insert their own ocorrencias"
ON public.ocorrencias FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ocorrencias or as admin/franqueado"
ON public.ocorrencias FOR UPDATE
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'franqueado'::app_role)
);

-- Índices para performance
CREATE INDEX idx_ocorrencias_user_id ON public.ocorrencias(user_id);
CREATE INDEX idx_ocorrencias_status ON public.ocorrencias(status);
CREATE INDEX idx_ocorrencias_tipo ON public.ocorrencias(tipo);
CREATE INDEX idx_ocorrencias_data_ocorrencia ON public.ocorrencias(data_ocorrencia);