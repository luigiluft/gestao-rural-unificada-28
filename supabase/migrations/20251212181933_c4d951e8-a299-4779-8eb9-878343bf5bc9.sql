
-- =====================================================
-- FASE 6: Integração Financeira Automática
-- =====================================================

-- Tabela de vínculo financeiro entre fretes e contas
CREATE TABLE public.frete_financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frete_id uuid NOT NULL REFERENCES public.fretes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento date,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  
  -- Referências opcionais para integração com sistema financeiro existente
  conta_receber_id uuid,
  conta_pagar_id uuid,
  
  -- Dados do beneficiário (para despesas)
  beneficiario_tipo text CHECK (beneficiario_tipo IN ('AGREGADO', 'TRANSPORTADORA')),
  beneficiario_id uuid, -- cliente_id da transportadora ou motorista_id do agregado
  beneficiario_nome text,
  beneficiario_cpf_cnpj text,
  beneficiario_dados_bancarios jsonb,
  
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para frete_financeiro
CREATE INDEX idx_frete_financeiro_frete_id ON public.frete_financeiro(frete_id);
CREATE INDEX idx_frete_financeiro_tipo ON public.frete_financeiro(tipo);
CREATE INDEX idx_frete_financeiro_status ON public.frete_financeiro(status);
CREATE INDEX idx_frete_financeiro_beneficiario_id ON public.frete_financeiro(beneficiario_id);

-- RLS para frete_financeiro
ALTER TABLE public.frete_financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frete_financeiro_select_policy" ON public.frete_financeiro
  FOR SELECT USING (
    check_user_role_safe(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.fretes f 
      WHERE f.id = frete_financeiro.frete_id 
      AND user_is_cliente_member(auth.uid(), f.cliente_id)
    )
  );

CREATE POLICY "frete_financeiro_insert_policy" ON public.frete_financeiro
  FOR INSERT WITH CHECK (
    check_user_role_safe(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.fretes f 
      WHERE f.id = frete_financeiro.frete_id 
      AND user_is_cliente_member(auth.uid(), f.cliente_id)
    )
  );

CREATE POLICY "frete_financeiro_update_policy" ON public.frete_financeiro
  FOR UPDATE USING (
    check_user_role_safe(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.fretes f 
      WHERE f.id = frete_financeiro.frete_id 
      AND user_is_cliente_member(auth.uid(), f.cliente_id)
    )
  );

CREATE POLICY "frete_financeiro_delete_policy" ON public.frete_financeiro
  FOR DELETE USING (
    check_user_role_safe(auth.uid(), 'admin')
  );

-- Trigger para updated_at
CREATE TRIGGER update_frete_financeiro_updated_at
  BEFORE UPDATE ON public.frete_financeiro
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Função para gerar registros financeiros automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.gerar_financeiro_frete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_embarque RECORD;
  v_transportadora RECORD;
BEGIN
  -- Buscar dados do embarque para descrição
  SELECT numero INTO v_embarque FROM public.embarques WHERE id = NEW.embarque_id;

  -- Sempre gerar receita (valor cobrado do cliente)
  IF NEW.preco_cobrado > 0 THEN
    INSERT INTO public.frete_financeiro (
      frete_id, tipo, descricao, valor, status, created_by
    ) VALUES (
      NEW.id,
      'RECEITA',
      'Frete do embarque ' || COALESCE(v_embarque.numero, NEW.embarque_id::text),
      NEW.preco_cobrado,
      'pendente',
      NEW.created_by
    );
  END IF;

  -- Gerar despesa baseado no tipo de executor
  IF NEW.custo_frete > 0 THEN
    IF NEW.executor_type = 'AGREGADO' THEN
      INSERT INTO public.frete_financeiro (
        frete_id, tipo, descricao, valor, status,
        beneficiario_tipo, beneficiario_nome, beneficiario_cpf_cnpj,
        beneficiario_dados_bancarios, created_by
      ) VALUES (
        NEW.id,
        'DESPESA',
        'Repasse ao agregado - Embarque ' || COALESCE(v_embarque.numero, NEW.embarque_id::text),
        NEW.custo_frete,
        'pendente',
        'AGREGADO',
        NEW.motorista_agregado_nome,
        NEW.motorista_agregado_cpf,
        NEW.motorista_agregado_dados_bancarios,
        NEW.created_by
      );
    ELSIF NEW.executor_type = 'TRANSPORTADORA_PARCEIRA' AND NEW.transportadora_parceira_id IS NOT NULL THEN
      -- Buscar dados da transportadora
      SELECT razao_social, cpf_cnpj INTO v_transportadora 
      FROM public.clientes WHERE id = NEW.transportadora_parceira_id;
      
      INSERT INTO public.frete_financeiro (
        frete_id, tipo, descricao, valor, status,
        beneficiario_tipo, beneficiario_id, beneficiario_nome, beneficiario_cpf_cnpj,
        created_by
      ) VALUES (
        NEW.id,
        'DESPESA',
        'Frete transportadora - Embarque ' || COALESCE(v_embarque.numero, NEW.embarque_id::text),
        NEW.custo_frete,
        'pendente',
        'TRANSPORTADORA',
        NEW.transportadora_parceira_id,
        v_transportadora.razao_social,
        v_transportadora.cpf_cnpj,
        NEW.created_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para gerar financeiro automaticamente ao criar frete
CREATE TRIGGER trigger_gerar_financeiro_frete
  AFTER INSERT ON public.fretes
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_financeiro_frete();
