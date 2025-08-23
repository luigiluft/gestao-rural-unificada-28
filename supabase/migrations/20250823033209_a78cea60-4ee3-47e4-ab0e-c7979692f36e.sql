-- Criar tabela de configurações do sistema
CREATE TABLE public.configuracoes_sistema (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.configuracoes_sistema (chave, valor, descricao) VALUES
('peso_minimo_mopp', '1000', 'Peso mínimo em Kg/L para exigir MOPP do motorista'),
('horarios_retirada', '["08:00-09:00", "09:00-10:00", "10:00-11:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"]', 'Janelas de horário disponíveis para retirada');

-- Adicionar campos de transporte à tabela saidas
ALTER TABLE public.saidas ADD COLUMN placa_veiculo TEXT;
ALTER TABLE public.saidas ADD COLUMN nome_motorista TEXT;
ALTER TABLE public.saidas ADD COLUMN cpf_motorista TEXT;
ALTER TABLE public.saidas ADD COLUMN mopp_motorista TEXT;
ALTER TABLE public.saidas ADD COLUMN janela_horario TEXT;

-- Enable RLS na tabela configuracoes_sistema
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para configuracoes_sistema
CREATE POLICY "Admins can manage system configurations"
ON public.configuracoes_sistema
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can read system configurations"
ON public.configuracoes_sistema
FOR SELECT
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();