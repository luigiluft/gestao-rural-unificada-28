-- =============================================
-- MARKETPLACE AGROHUB - TABELAS E POLÍTICAS
-- =============================================

-- 1. Tabela de configuração da loja por cliente
CREATE TABLE public.loja_configuracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Configurações básicas
  loja_habilitada BOOLEAN DEFAULT false,
  participar_marketplace BOOLEAN DEFAULT true,
  
  -- Identidade da loja
  nome_loja TEXT,
  slug TEXT UNIQUE,
  descricao TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Contato
  whatsapp TEXT,
  email_contato TEXT,
  horario_atendimento TEXT,
  
  -- Configurações de exibição
  mostrar_endereco BOOLEAN DEFAULT false,
  mostrar_telefone BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT loja_configuracao_cliente_unique UNIQUE(cliente_id)
);

-- 2. Tabela de anúncios/produtos à venda
CREATE TABLE public.loja_anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  
  -- Informações do anúncio
  titulo TEXT NOT NULL,
  descricao_anuncio TEXT,
  
  -- Preços
  preco_unitario NUMERIC NOT NULL,
  preco_promocional NUMERIC,
  unidade_venda TEXT DEFAULT 'kg',
  
  -- Quantidades
  quantidade_minima NUMERIC DEFAULT 1,
  quantidade_disponivel NUMERIC,
  usar_estoque_real BOOLEAN DEFAULT false,
  
  -- Visibilidade
  ativo BOOLEAN DEFAULT true,
  visivel_marketplace BOOLEAN DEFAULT true,
  visivel_loja_propria BOOLEAN DEFAULT true,
  
  -- Imagens
  imagens JSONB DEFAULT '[]',
  
  -- SEO/Busca
  tags TEXT[],
  categoria TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de pedidos
CREATE TABLE public.loja_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL UNIQUE,
  
  -- Vendedor
  vendedor_cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  
  -- Comprador
  comprador_user_id UUID REFERENCES auth.users(id),
  comprador_nome TEXT NOT NULL,
  comprador_email TEXT NOT NULL,
  comprador_telefone TEXT,
  comprador_cpf_cnpj TEXT,
  
  -- Endereço de entrega
  endereco_entrega JSONB NOT NULL,
  
  -- Valores
  subtotal NUMERIC NOT NULL,
  valor_frete NUMERIC DEFAULT 0,
  valor_desconto NUMERIC DEFAULT 0,
  valor_total NUMERIC NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pendente',
  
  -- Origem
  origem TEXT DEFAULT 'marketplace',
  loja_slug TEXT,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de itens do pedido
CREATE TABLE public.loja_pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.loja_pedidos(id) ON DELETE CASCADE,
  anuncio_id UUID NOT NULL REFERENCES public.loja_anuncios(id),
  
  quantidade NUMERIC NOT NULL,
  preco_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_loja_configuracao_cliente ON public.loja_configuracao(cliente_id);
CREATE INDEX idx_loja_configuracao_slug ON public.loja_configuracao(slug);
CREATE INDEX idx_loja_anuncios_cliente ON public.loja_anuncios(cliente_id);
CREATE INDEX idx_loja_anuncios_produto ON public.loja_anuncios(produto_id);
CREATE INDEX idx_loja_anuncios_ativo ON public.loja_anuncios(ativo) WHERE ativo = true;
CREATE INDEX idx_loja_pedidos_vendedor ON public.loja_pedidos(vendedor_cliente_id);
CREATE INDEX idx_loja_pedidos_comprador ON public.loja_pedidos(comprador_user_id);
CREATE INDEX idx_loja_pedidos_status ON public.loja_pedidos(status);
CREATE INDEX idx_loja_pedido_itens_pedido ON public.loja_pedido_itens(pedido_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Habilitar RLS
ALTER TABLE public.loja_configuracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_pedido_itens ENABLE ROW LEVEL SECURITY;

-- LOJA_CONFIGURACAO Policies
CREATE POLICY "loja_configuracao_select" ON public.loja_configuracao
  FOR SELECT USING (
    -- Qualquer um pode ver lojas habilitadas (para marketplace público)
    (loja_habilitada = true)
    OR
    -- Dono pode ver sua configuração
    (EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_configuracao.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    ))
    OR
    -- Admin pode ver tudo
    public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_configuracao_insert" ON public.loja_configuracao
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_configuracao.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
    OR public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_configuracao_update" ON public.loja_configuracao
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_configuracao.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
    OR public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_configuracao_delete" ON public.loja_configuracao
  FOR DELETE USING (
    public.check_user_role_safe(auth.uid(), 'admin')
  );

-- LOJA_ANUNCIOS Policies
CREATE POLICY "loja_anuncios_select" ON public.loja_anuncios
  FOR SELECT USING (
    -- Anúncios ativos são públicos (para marketplace)
    (ativo = true AND (visivel_marketplace = true OR visivel_loja_propria = true))
    OR
    -- Dono pode ver todos seus anúncios
    (EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_anuncios.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    ))
    OR
    -- Admin pode ver tudo
    public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_anuncios_insert" ON public.loja_anuncios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_anuncios.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
    OR public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_anuncios_update" ON public.loja_anuncios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_anuncios.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
    OR public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_anuncios_delete" ON public.loja_anuncios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_anuncios.cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    )
    OR public.check_user_role_safe(auth.uid(), 'admin')
  );

-- LOJA_PEDIDOS Policies
CREATE POLICY "loja_pedidos_select" ON public.loja_pedidos
  FOR SELECT USING (
    -- Vendedor pode ver seus pedidos
    (EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_pedidos.vendedor_cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    ))
    OR
    -- Comprador pode ver seus pedidos
    (comprador_user_id = auth.uid())
    OR
    -- Admin pode ver tudo
    public.check_user_role_safe(auth.uid(), 'admin')
  );

CREATE POLICY "loja_pedidos_insert" ON public.loja_pedidos
  FOR INSERT WITH CHECK (
    -- Qualquer usuário autenticado pode criar pedido (comprar)
    auth.uid() IS NOT NULL
  );

CREATE POLICY "loja_pedidos_update" ON public.loja_pedidos
  FOR UPDATE USING (
    -- Vendedor pode atualizar status
    (EXISTS (
      SELECT 1 FROM public.cliente_usuarios cu
      WHERE cu.cliente_id = loja_pedidos.vendedor_cliente_id
      AND cu.user_id = auth.uid()
      AND cu.ativo = true
    ))
    OR
    -- Admin pode atualizar
    public.check_user_role_safe(auth.uid(), 'admin')
  );

-- LOJA_PEDIDO_ITENS Policies
CREATE POLICY "loja_pedido_itens_select" ON public.loja_pedido_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loja_pedidos p
      WHERE p.id = loja_pedido_itens.pedido_id
      AND (
        -- Vendedor
        EXISTS (
          SELECT 1 FROM public.cliente_usuarios cu
          WHERE cu.cliente_id = p.vendedor_cliente_id
          AND cu.user_id = auth.uid()
          AND cu.ativo = true
        )
        OR
        -- Comprador
        p.comprador_user_id = auth.uid()
        OR
        -- Admin
        public.check_user_role_safe(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "loja_pedido_itens_insert" ON public.loja_pedido_itens
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para gerar número do pedido
CREATE OR REPLACE FUNCTION public.gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  numero TEXT;
BEGIN
  ano := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_pedido, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO sequencia
  FROM public.loja_pedidos
  WHERE numero_pedido LIKE 'PED-' || ano || '-%';
  
  numero := 'PED-' || ano || '-' || LPAD(sequencia::TEXT, 5, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para gerar número do pedido automaticamente
CREATE OR REPLACE FUNCTION public.trigger_gerar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_pedido IS NULL OR NEW.numero_pedido = '' THEN
    NEW.numero_pedido := public.gerar_numero_pedido();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_loja_pedidos_numero
  BEFORE INSERT ON public.loja_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_gerar_numero_pedido();

-- Trigger para atualizar updated_at
CREATE TRIGGER tr_loja_configuracao_updated
  BEFORE UPDATE ON public.loja_configuracao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_loja_anuncios_updated
  BEFORE UPDATE ON public.loja_anuncios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_loja_pedidos_updated
  BEFORE UPDATE ON public.loja_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PERMISSÕES DE PÁGINA
-- =============================================
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('minha-loja', 'cliente', true, true),
  ('minha-loja', 'admin', true, true),
  ('minha-loja', 'operador', false, false),
  ('minha-loja', 'motorista', false, false)
ON CONFLICT (page_key, role) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  visible_in_menu = EXCLUDED.visible_in_menu;