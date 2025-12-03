-- Create quotation table for store quotes
CREATE TABLE public.cotacoes_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consumidor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consumidor_nome TEXT NOT NULL,
  consumidor_email TEXT NOT NULL,
  consumidor_telefone TEXT,
  consumidor_empresa TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'convertida')),
  observacoes TEXT,
  resposta_cliente TEXT,
  data_resposta TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotation items table with monthly quantities
CREATE TABLE public.cotacao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id UUID NOT NULL REFERENCES public.cotacoes_loja(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.cliente_produtos(id) ON DELETE CASCADE,
  mes_1 NUMERIC DEFAULT 0,
  mes_2 NUMERIC DEFAULT 0,
  mes_3 NUMERIC DEFAULT 0,
  mes_4 NUMERIC DEFAULT 0,
  mes_5 NUMERIC DEFAULT 0,
  mes_6 NUMERIC DEFAULT 0,
  mes_7 NUMERIC DEFAULT 0,
  mes_8 NUMERIC DEFAULT 0,
  mes_9 NUMERIC DEFAULT 0,
  mes_10 NUMERIC DEFAULT 0,
  mes_11 NUMERIC DEFAULT 0,
  mes_12 NUMERIC DEFAULT 0,
  preco_sugerido NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cotacoes_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacao_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cotacoes_loja
CREATE POLICY "cotacoes_loja_insert_anon" ON public.cotacoes_loja
FOR INSERT WITH CHECK (true);

CREATE POLICY "cotacoes_loja_insert_auth" ON public.cotacoes_loja
FOR INSERT TO authenticated WITH CHECK (consumidor_id = auth.uid() OR consumidor_id IS NULL);

CREATE POLICY "cotacoes_loja_select_consumidor" ON public.cotacoes_loja
FOR SELECT TO authenticated USING (consumidor_id = auth.uid());

CREATE POLICY "cotacoes_loja_select_cliente" ON public.cotacoes_loja
FOR SELECT TO authenticated USING (
  public.check_user_role_safe(auth.uid(), 'admin') OR
  public.user_is_cliente_member(auth.uid(), cliente_id)
);

CREATE POLICY "cotacoes_loja_update_cliente" ON public.cotacoes_loja
FOR UPDATE TO authenticated USING (
  public.check_user_role_safe(auth.uid(), 'admin') OR
  public.user_is_cliente_member(auth.uid(), cliente_id)
);

-- RLS Policies for cotacao_itens
CREATE POLICY "cotacao_itens_insert" ON public.cotacao_itens
FOR INSERT WITH CHECK (true);

CREATE POLICY "cotacao_itens_select" ON public.cotacao_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cotacoes_loja c
    WHERE c.id = cotacao_itens.cotacao_id
    AND (
      c.consumidor_id = auth.uid() OR
      public.check_user_role_safe(auth.uid(), 'admin') OR
      public.user_is_cliente_member(auth.uid(), c.cliente_id)
    )
  )
);

-- Indexes
CREATE INDEX idx_cotacoes_loja_cliente_id ON public.cotacoes_loja(cliente_id);
CREATE INDEX idx_cotacoes_loja_consumidor_id ON public.cotacoes_loja(consumidor_id);
CREATE INDEX idx_cotacoes_loja_status ON public.cotacoes_loja(status);
CREATE INDEX idx_cotacao_itens_cotacao_id ON public.cotacao_itens(cotacao_id);