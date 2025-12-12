
-- =============================================
-- FASE 1: Flags de Capacidade de Transporte
-- =============================================

-- Adicionar flags de capacidade na tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS has_own_fleet boolean DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS can_aggregate boolean DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS can_collect boolean DEFAULT false;

COMMENT ON COLUMN clientes.has_own_fleet IS 'Empresa possui frota própria de veículos';
COMMENT ON COLUMN clientes.can_aggregate IS 'Empresa pode agregar terceiros (autônomos ou transportadoras)';
COMMENT ON COLUMN clientes.can_collect IS 'Empresa realiza coletas além de entregas a partir de bases próprias';

-- =============================================
-- FASE 2: Entidade Embarque (Shipment)
-- =============================================

-- Criar tabela de embarques
CREATE TABLE public.embarques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero text NOT NULL,
  
  -- Origem
  tipo_origem text NOT NULL DEFAULT 'BASE_PROPRIA' CHECK (tipo_origem IN ('BASE_PROPRIA', 'COLETA')),
  origem_deposito_id uuid REFERENCES cliente_depositos(id),
  origem_endereco jsonb, -- Para coleta: {logradouro, numero, cidade, estado, cep, lat, lng, contato, telefone}
  origem_janela_inicio timestamp with time zone,
  origem_janela_fim timestamp with time zone,
  
  -- Destinos (múltiplos)
  destinos jsonb NOT NULL DEFAULT '[]', -- [{endereco: {}, janela_inicio, janela_fim, contato, ordem}]
  
  -- Volumes e peso
  peso_total numeric,
  volume_total numeric,
  quantidade_volumes integer,
  
  -- Documentos vinculados
  saidas_ids jsonb DEFAULT '[]', -- UUIDs das saídas/NFs associadas
  
  -- Status
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando_frete', 'em_roteirizacao', 'em_transito', 'entregue', 'cancelado')),
  
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_embarques_cliente_id ON public.embarques(cliente_id);
CREATE INDEX idx_embarques_status ON public.embarques(status);
CREATE INDEX idx_embarques_created_at ON public.embarques(created_at DESC);

-- Enable RLS
ALTER TABLE public.embarques ENABLE ROW LEVEL SECURITY;

-- RLS Policies para embarques
CREATE POLICY "embarques_select_policy" ON public.embarques
  FOR SELECT
  USING (
    check_user_role_safe(auth.uid(), 'admin'::app_role)
    OR user_is_cliente_member(auth.uid(), cliente_id)
  );

CREATE POLICY "embarques_insert_policy" ON public.embarques
  FOR INSERT
  WITH CHECK (
    check_user_role_safe(auth.uid(), 'admin'::app_role)
    OR user_is_cliente_member(auth.uid(), cliente_id)
  );

CREATE POLICY "embarques_update_policy" ON public.embarques
  FOR UPDATE
  USING (
    check_user_role_safe(auth.uid(), 'admin'::app_role)
    OR user_is_cliente_member(auth.uid(), cliente_id)
  );

CREATE POLICY "embarques_delete_policy" ON public.embarques
  FOR DELETE
  USING (
    check_user_role_safe(auth.uid(), 'admin'::app_role)
    OR user_is_cliente_member(auth.uid(), cliente_id)
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_embarques_updated_at
  BEFORE UPDATE ON public.embarques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número sequencial do embarque
CREATE OR REPLACE FUNCTION public.gerar_numero_embarque(p_cliente_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_numero text;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM embarques
  WHERE cliente_id = p_cliente_id;
  
  v_numero := 'EMB-' || LPAD(v_count::text, 6, '0');
  RETURN v_numero;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_numero_embarque(uuid) TO authenticated;
