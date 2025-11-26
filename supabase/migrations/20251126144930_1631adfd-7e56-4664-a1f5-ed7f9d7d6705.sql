-- Criar tabela de folha de pagamento
CREATE TABLE IF NOT EXISTS public.folha_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deposito_id UUID NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  salario_mensal NUMERIC NOT NULL CHECK (salario_mensal >= 0),
  cargo TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  -- Garantir que não haja registros duplicados ativos
  CONSTRAINT folha_pagamento_unique_active UNIQUE (user_id, deposito_id, ativo) 
    DEFERRABLE INITIALLY DEFERRED,
  
  -- Garantir que data_fim seja posterior a data_inicio
  CONSTRAINT folha_pagamento_datas_validas CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Criar índices para melhor performance
CREATE INDEX idx_folha_pagamento_user_id ON public.folha_pagamento(user_id);
CREATE INDEX idx_folha_pagamento_deposito_id ON public.folha_pagamento(deposito_id);
CREATE INDEX idx_folha_pagamento_ativo ON public.folha_pagamento(ativo) WHERE ativo = true;

-- Habilitar RLS
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

-- Política para admins (acesso total)
CREATE POLICY "Admins can manage all folha_pagamento"
  ON public.folha_pagamento
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política para operadores (apenas seus depósitos)
CREATE POLICY "Operadores can manage folha in their deposits"
  ON public.folha_pagamento
  FOR ALL
  USING (
    has_role(auth.uid(), 'operador'::app_role) AND
    deposito_id IN (
      SELECT franquia_id 
      FROM franquia_usuarios 
      WHERE user_id = auth.uid() AND ativo = true
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'operador'::app_role) AND
    deposito_id IN (
      SELECT franquia_id 
      FROM franquia_usuarios 
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- Política para usuários verem seus próprios dados
CREATE POLICY "Users can view their own folha_pagamento"
  ON public.folha_pagamento
  FOR SELECT
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_folha_pagamento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_folha_pagamento_updated_at
  BEFORE UPDATE ON public.folha_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_folha_pagamento_updated_at();

-- Adicionar permissões para a nova página
INSERT INTO page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('funcionarios', 'admin', true, true),
  ('funcionarios', 'operador', true, true),
  ('funcionarios', 'cliente', false, false),
  ('funcionarios', 'motorista', false, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;