-- Criar tabela de configurações de priorização
CREATE TABLE IF NOT EXISTS public.configuracoes_priorizacao_separacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franquia_id UUID NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  modo_priorizacao TEXT NOT NULL DEFAULT 'fifo' CHECK (modo_priorizacao IN ('fifo', 'customizado')),
  fatores JSONB NOT NULL DEFAULT '[
    {
      "id": "sla_contrato",
      "nome": "SLA do Contrato",
      "ativo": true,
      "peso": 40,
      "configuracao": {
        "tipo": "sla_contrato",
        "campo_referencia": "valor_esperado",
        "unidade": "horas"
      }
    },
    {
      "id": "proximidade_agendamento",
      "nome": "Proximidade do Agendamento",
      "ativo": true,
      "peso": 30,
      "configuracao": {
        "tipo": "data",
        "campo_referencia": "data_saida",
        "calculo": "dias_ate_entrega"
      }
    },
    {
      "id": "cliente_vip",
      "nome": "Cliente VIP / Urgente",
      "ativo": true,
      "peso": 20,
      "configuracao": {
        "tipo": "flag",
        "verificar_tag": "vip",
        "verificar_prioridade": "urgente"
      }
    },
    {
      "id": "tempo_fila",
      "nome": "Tempo na Fila",
      "ativo": true,
      "peso": 10,
      "configuracao": {
        "tipo": "tempo",
        "campo_referencia": "created_at",
        "max_horas": 72
      }
    }
  ]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(franquia_id, ativo)
);

-- Enable RLS
ALTER TABLE public.configuracoes_priorizacao_separacao ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Somente admins e franqueados (produtores NÃO podem ver)
CREATE POLICY "Admins can manage all configs"
ON public.configuracoes_priorizacao_separacao
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can manage their own configs"
ON public.configuracoes_priorizacao_separacao
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND
  franquia_id IN (
    SELECT id FROM public.franquias
    WHERE master_franqueado_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'franqueado'::app_role) AND
  franquia_id IN (
    SELECT id FROM public.franquias
    WHERE master_franqueado_id = auth.uid()
  )
);

-- Criar índices
CREATE INDEX idx_config_priorizacao_franquia ON public.configuracoes_priorizacao_separacao(franquia_id);
CREATE INDEX idx_config_priorizacao_ativo ON public.configuracoes_priorizacao_separacao(franquia_id, ativo) WHERE ativo = true;