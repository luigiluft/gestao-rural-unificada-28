-- PHASE 3: Admin marketplace configurations
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES 
  ('marketplace_logo_url', '', 'URL do logo do marketplace'),
  ('marketplace_banner_url', '', 'URL do banner do marketplace'),
  ('marketplace_cor_primaria', '#22c55e', 'Cor primária do marketplace'),
  ('marketplace_cor_secundaria', '#16a34a', 'Cor secundária do marketplace'),
  ('plataforma_logo_url', '', 'URL do logo da plataforma')
ON CONFLICT (chave) DO NOTHING;

-- PHASE 4: Consumer account tables

-- Wishlist table
CREATE TABLE IF NOT EXISTS public.consumidor_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.cliente_produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, produto_id)
);

-- Consumer addresses
CREATE TABLE IF NOT EXISTS public.consumidor_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apelido TEXT NOT NULL,
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product reviews
CREATE TABLE IF NOT EXISTS public.produto_avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.cliente_produtos(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES public.loja_pedidos(id) ON DELETE SET NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  titulo TEXT,
  comentario TEXT,
  fotos JSONB DEFAULT '[]',
  aprovada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, produto_id)
);

-- Consumer reward points
CREATE TABLE IF NOT EXISTS public.consumidor_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  saldo_atual INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Points history
CREATE TABLE IF NOT EXISTS public.consumidor_pontos_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  quantidade INTEGER NOT NULL,
  origem TEXT,
  referencia_id UUID,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consumer farms/delivery locations
CREATE TABLE IF NOT EXISTS public.consumidor_fazendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'fazenda',
  endereco_cep TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_estado TEXT,
  area_hectares NUMERIC,
  car TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store returns
CREATE TABLE IF NOT EXISTS public.loja_devolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.loja_pedidos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  descricao TEXT,
  fotos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'em_analise', 'aprovada', 'rejeitada', 'concluida')),
  resposta_vendedor TEXT,
  data_resposta TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consumidor_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumidor_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumidor_pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumidor_pontos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumidor_fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_devolucoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consumidor_wishlist
CREATE POLICY "Users can view own wishlist" ON public.consumidor_wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own wishlist" ON public.consumidor_wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own wishlist" ON public.consumidor_wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for consumidor_enderecos
CREATE POLICY "Users can view own addresses" ON public.consumidor_enderecos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own addresses" ON public.consumidor_enderecos
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for produto_avaliacoes
CREATE POLICY "Anyone can view approved reviews" ON public.produto_avaliacoes
  FOR SELECT USING (aprovada = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own reviews" ON public.produto_avaliacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.produto_avaliacoes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.produto_avaliacoes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for consumidor_pontos
CREATE POLICY "Users can view own points" ON public.consumidor_pontos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage points" ON public.consumidor_pontos
  FOR ALL USING (true);

-- RLS Policies for consumidor_pontos_historico
CREATE POLICY "Users can view own points history" ON public.consumidor_pontos_historico
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for consumidor_fazendas
CREATE POLICY "Users can view own farms" ON public.consumidor_fazendas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own farms" ON public.consumidor_fazendas
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for loja_devolucoes
CREATE POLICY "Users can view own returns" ON public.loja_devolucoes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own returns" ON public.loja_devolucoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending returns" ON public.loja_devolucoes
  FOR UPDATE USING (auth.uid() = user_id AND status = 'solicitada');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consumidor_wishlist_user ON public.consumidor_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_consumidor_enderecos_user ON public.consumidor_enderecos(user_id);
CREATE INDEX IF NOT EXISTS idx_produto_avaliacoes_produto ON public.produto_avaliacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_avaliacoes_user ON public.produto_avaliacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_consumidor_pontos_historico_user ON public.consumidor_pontos_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_consumidor_fazendas_user ON public.consumidor_fazendas(user_id);
CREATE INDEX IF NOT EXISTS idx_loja_devolucoes_user ON public.loja_devolucoes(user_id);
CREATE INDEX IF NOT EXISTS idx_loja_devolucoes_pedido ON public.loja_devolucoes(pedido_id);