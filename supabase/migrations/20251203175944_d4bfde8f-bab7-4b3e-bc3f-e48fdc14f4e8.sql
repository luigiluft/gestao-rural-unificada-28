-- Criar tabela cliente_produtos para consolidar produtos únicos de cada cliente
CREATE TABLE public.cliente_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  codigo_produto TEXT,
  nome_produto TEXT NOT NULL,
  descricao TEXT,
  unidade_medida TEXT NOT NULL DEFAULT 'UN',
  ncm TEXT,
  -- Campos de venda (preenchidos pelo cliente)
  preco_unitario NUMERIC,
  preco_promocional NUMERIC,
  categoria TEXT,
  descricao_anuncio TEXT,
  imagens JSONB DEFAULT '[]'::jsonb,
  -- Flags de visibilidade
  ativo_marketplace BOOLEAN DEFAULT FALSE,
  ativo_loja_propria BOOLEAN DEFAULT FALSE,
  -- Controle
  quantidade_minima NUMERIC DEFAULT 1,
  usar_estoque_real BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, codigo_produto)
);

-- Índices para performance
CREATE INDEX idx_cliente_produtos_cliente_id ON public.cliente_produtos(cliente_id);
CREATE INDEX idx_cliente_produtos_ativo_marketplace ON public.cliente_produtos(ativo_marketplace) WHERE ativo_marketplace = true;
CREATE INDEX idx_cliente_produtos_ativo_loja ON public.cliente_produtos(ativo_loja_propria) WHERE ativo_loja_propria = true;

-- Enable RLS
ALTER TABLE public.cliente_produtos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "cliente_produtos_select_policy" ON public.cliente_produtos
FOR SELECT USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) OR
  user_is_cliente_member(auth.uid(), cliente_id) OR
  (ativo_marketplace = true OR ativo_loja_propria = true) -- Produtos ativos são públicos
);

CREATE POLICY "cliente_produtos_insert_policy" ON public.cliente_produtos
FOR INSERT WITH CHECK (
  check_user_role_safe(auth.uid(), 'admin'::app_role) OR
  user_is_cliente_member(auth.uid(), cliente_id)
);

CREATE POLICY "cliente_produtos_update_policy" ON public.cliente_produtos
FOR UPDATE USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) OR
  user_is_cliente_member(auth.uid(), cliente_id)
);

CREATE POLICY "cliente_produtos_delete_policy" ON public.cliente_produtos
FOR DELETE USING (
  check_user_role_safe(auth.uid(), 'admin'::app_role) OR
  user_is_cliente_member(auth.uid(), cliente_id)
);

-- Função para sincronizar produtos quando entrada é aprovada
CREATE OR REPLACE FUNCTION public.sync_cliente_produtos_from_entrada()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_id UUID;
BEGIN
  -- Apenas processar quando status muda para 'confirmado'
  IF NEW.status_aprovacao = 'confirmado' AND (OLD.status_aprovacao IS NULL OR OLD.status_aprovacao != 'confirmado') THEN
    -- Buscar o cliente_id associado ao user_id da entrada
    SELECT cu.cliente_id INTO v_cliente_id
    FROM public.cliente_usuarios cu
    WHERE cu.user_id = NEW.user_id AND cu.ativo = true
    LIMIT 1;
    
    IF v_cliente_id IS NOT NULL THEN
      -- Inserir/atualizar produtos únicos do cliente
      INSERT INTO public.cliente_produtos (cliente_id, codigo_produto, nome_produto, unidade_medida, ncm)
      SELECT DISTINCT 
        v_cliente_id,
        ei.codigo_produto,
        COALESCE(ei.nome_produto, ei.descricao_produto, 'Produto sem nome'),
        COALESCE(ei.unidade_comercial, 'UN'),
        ei.ncm
      FROM public.entrada_itens ei
      WHERE ei.entrada_id = NEW.id
        AND ei.codigo_produto IS NOT NULL
      ON CONFLICT (cliente_id, codigo_produto) 
      DO UPDATE SET 
        nome_produto = COALESCE(EXCLUDED.nome_produto, cliente_produtos.nome_produto),
        unidade_medida = COALESCE(EXCLUDED.unidade_medida, cliente_produtos.unidade_medida),
        ncm = COALESCE(EXCLUDED.ncm, cliente_produtos.ncm),
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para sincronizar produtos automaticamente
CREATE TRIGGER trigger_sync_cliente_produtos
AFTER UPDATE ON public.entradas
FOR EACH ROW
EXECUTE FUNCTION public.sync_cliente_produtos_from_entrada();

-- Popular tabela com dados históricos
INSERT INTO public.cliente_produtos (cliente_id, codigo_produto, nome_produto, unidade_medida, ncm)
SELECT DISTINCT 
  cu.cliente_id,
  ei.codigo_produto,
  COALESCE(ei.nome_produto, ei.descricao_produto, 'Produto sem nome'),
  COALESCE(ei.unidade_comercial, 'UN'),
  ei.ncm
FROM public.entrada_itens ei
JOIN public.entradas e ON e.id = ei.entrada_id
JOIN public.cliente_usuarios cu ON cu.user_id = e.user_id AND cu.ativo = true
WHERE ei.codigo_produto IS NOT NULL
  AND e.status_aprovacao = 'confirmado'
ON CONFLICT (cliente_id, codigo_produto) DO NOTHING;