
-- =====================================================
-- FASE 3: Criar Entidade Frete (Contrato de Transporte)
-- =====================================================

-- Criar tabela fretes
CREATE TABLE public.fretes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  embarque_id uuid NOT NULL REFERENCES public.embarques(id) ON DELETE CASCADE,
  
  -- Tipo de execução
  executor_type text NOT NULL CHECK (executor_type IN ('FROTA_PROPRIA', 'AGREGADO', 'TRANSPORTADORA_PARCEIRA')),
  origin_type text NOT NULL DEFAULT 'BASE_PROPRIA' CHECK (origin_type IN ('BASE_PROPRIA', 'COLETA')),
  
  -- Executor (depende do tipo)
  transportadora_parceira_id uuid REFERENCES public.clientes(id), -- Se TRANSPORTADORA_PARCEIRA
  motorista_agregado_cpf text, -- Se AGREGADO
  motorista_agregado_nome text,
  motorista_agregado_dados_bancarios jsonb,
  
  -- Veículo e motorista (para FROTA_PROPRIA ou AGREGADO)
  veiculo_id uuid REFERENCES public.veiculos(id),
  motorista_id uuid REFERENCES public.motoristas(id),
  
  -- Tabela de frete aplicada
  tabela_frete_id uuid REFERENCES public.tabelas_frete(id),
  
  -- Valores
  preco_cobrado numeric NOT NULL DEFAULT 0, -- Valor cobrado do cliente final
  custo_frete numeric NOT NULL DEFAULT 0, -- Custo real (pagamento ao executor)
  margem_calculada numeric GENERATED ALWAYS AS (preco_cobrado - custo_frete) STORED,
  
  -- SLA
  sla_prazo_horas integer,
  sla_prazo_data timestamp with time zone,
  
  -- CT-e (se aplicável)
  cte_id uuid REFERENCES public.ctes(id),
  
  -- Status
  status text NOT NULL DEFAULT 'contratado' CHECK (status IN ('contratado', 'em_execucao', 'entregue', 'faturado', 'cancelado')),
  
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para fretes
CREATE INDEX idx_fretes_cliente_id ON public.fretes(cliente_id);
CREATE INDEX idx_fretes_embarque_id ON public.fretes(embarque_id);
CREATE INDEX idx_fretes_executor_type ON public.fretes(executor_type);
CREATE INDEX idx_fretes_status ON public.fretes(status);
CREATE INDEX idx_fretes_transportadora_parceira_id ON public.fretes(transportadora_parceira_id);

-- RLS para fretes
ALTER TABLE public.fretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fretes_select_policy" ON public.fretes
  FOR SELECT USING (
    check_user_role_safe(auth.uid(), 'admin') OR
    user_is_cliente_member(auth.uid(), cliente_id) OR
    (transportadora_parceira_id IS NOT NULL AND user_is_cliente_member(auth.uid(), transportadora_parceira_id))
  );

CREATE POLICY "fretes_insert_policy" ON public.fretes
  FOR INSERT WITH CHECK (
    check_user_role_safe(auth.uid(), 'admin') OR
    user_is_cliente_member(auth.uid(), cliente_id)
  );

CREATE POLICY "fretes_update_policy" ON public.fretes
  FOR UPDATE USING (
    check_user_role_safe(auth.uid(), 'admin') OR
    user_is_cliente_member(auth.uid(), cliente_id)
  );

CREATE POLICY "fretes_delete_policy" ON public.fretes
  FOR DELETE USING (
    check_user_role_safe(auth.uid(), 'admin') OR
    user_is_cliente_member(auth.uid(), cliente_id)
  );

-- Trigger para updated_at em fretes
CREATE TRIGGER update_fretes_updated_at
  BEFORE UPDATE ON public.fretes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 4: Refatorar Entidade Viagem (Execução)
-- =====================================================

-- Adicionar campos na tabela viagens existente
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS frete_id uuid REFERENCES public.fretes(id);
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS tipo_execucao text DEFAULT 'FROTA_PROPRIA' CHECK (tipo_execucao IN ('FROTA_PROPRIA', 'AGREGADO', 'TRANSPORTADORA_PARCEIRA'));
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS paradas jsonb DEFAULT '[]';
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS pod jsonb;
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS ocorrencias_viagem jsonb DEFAULT '[]';

-- Índice para frete_id em viagens
CREATE INDEX IF NOT EXISTS idx_viagens_frete_id ON public.viagens(frete_id);
CREATE INDEX IF NOT EXISTS idx_viagens_tipo_execucao ON public.viagens(tipo_execucao);

-- =====================================================
-- FASE 5: Refatorar Motoristas e Veículos
-- =====================================================

-- Adicionar campos na tabela motoristas
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id);
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'PROPRIO' CHECK (tipo IN ('PROPRIO', 'AGREGADO'));
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS valor_repasse_padrao numeric;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS dados_bancarios jsonb;

-- Índices para motoristas
CREATE INDEX IF NOT EXISTS idx_motoristas_cliente_id ON public.motoristas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_tipo ON public.motoristas(tipo);
CREATE INDEX IF NOT EXISTS idx_motoristas_cpf_cnpj ON public.motoristas(cpf_cnpj);

-- Adicionar campos na tabela veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id);
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'PROPRIO' CHECK (tipo IN ('PROPRIO', 'AGREGADO', 'TERCEIRO'));
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS motorista_padrao_id uuid REFERENCES public.motoristas(id);

-- Índices para veiculos
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON public.veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_tipo ON public.veiculos(tipo);
CREATE INDEX IF NOT EXISTS idx_veiculos_motorista_padrao_id ON public.veiculos(motorista_padrao_id);
