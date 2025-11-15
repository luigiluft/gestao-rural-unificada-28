-- FASE 1: Migrar Fazendas para Cliente
-- Adicionar cliente_id na tabela fazendas
ALTER TABLE fazendas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_fazendas_cliente_id ON fazendas(cliente_id);

-- Migrar dados: popular cliente_id baseado em produtor_id
UPDATE fazendas f
SET cliente_id = cu.cliente_id
FROM cliente_usuarios cu
WHERE f.produtor_id = cu.user_id
  AND cu.ativo = true
  AND f.cliente_id IS NULL;

-- FASE 2: Criar tabela cliente_filiais
CREATE TABLE IF NOT EXISTS cliente_filiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  franquia_id UUID NOT NULL REFERENCES franquias(id) ON DELETE RESTRICT,
  nome VARCHAR(255) NOT NULL,
  codigo_interno VARCHAR(50),
  endereco_complementar TEXT,
  contato_local VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint: uma filial por cliente por franquia
  UNIQUE(cliente_id, franquia_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cliente_filiais_cliente ON cliente_filiais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_filiais_franquia ON cliente_filiais(franquia_id);
CREATE INDEX IF NOT EXISTS idx_cliente_filiais_ativo ON cliente_filiais(ativo);

-- RLS Policies para cliente_filiais
ALTER TABLE cliente_filiais ENABLE ROW LEVEL SECURITY;

-- Cliente pode ver/editar suas próprias filiais
DROP POLICY IF EXISTS "clientes_view_own_filiais" ON cliente_filiais;
CREATE POLICY "clientes_view_own_filiais" ON cliente_filiais
  FOR SELECT USING (
    cliente_id IN (
      SELECT cliente_id FROM cliente_usuarios 
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

DROP POLICY IF EXISTS "clientes_manage_own_filiais" ON cliente_filiais;
CREATE POLICY "clientes_manage_own_filiais" ON cliente_filiais
  FOR ALL USING (
    cliente_id IN (
      SELECT cliente_id FROM cliente_usuarios 
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- Franqueado pode ver filiais na sua franquia
DROP POLICY IF EXISTS "franqueados_view_filiais_in_franquia" ON cliente_filiais;
CREATE POLICY "franqueados_view_filiais_in_franquia" ON cliente_filiais
  FOR SELECT USING (
    franquia_id IN (
      SELECT id FROM franquias 
      WHERE master_franqueado_id = auth.uid() AND ativo = true
    )
  );

-- Admin pode ver tudo
DROP POLICY IF EXISTS "admin_all_filiais" ON cliente_filiais;
CREATE POLICY "admin_all_filiais" ON cliente_filiais
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- FASE 3: Adaptar Sistema de Estoque
-- Adicionar campos na tabela movimentacoes
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS cliente_filial_id UUID REFERENCES cliente_filiais(id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_cliente ON movimentacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_filial ON movimentacoes(cliente_filial_id);

-- Migrar dados existentes: popular cliente_id nas movimentações
UPDATE movimentacoes m
SET cliente_id = cu.cliente_id
FROM cliente_usuarios cu
WHERE m.user_id = cu.user_id
  AND cu.ativo = true
  AND m.cliente_id IS NULL;

-- Dropar e recriar a function get_estoque_from_movimentacoes com novos campos
DROP FUNCTION IF EXISTS get_estoque_from_movimentacoes();

CREATE OR REPLACE FUNCTION get_estoque_from_movimentacoes()
RETURNS TABLE (
  produto_id UUID,
  deposito_id UUID,
  user_id UUID,
  cliente_id UUID,
  cliente_filial_id UUID,
  lote TEXT,
  quantidade_atual NUMERIC,
  valor_unitario NUMERIC,
  valor_total NUMERIC,
  produtos JSONB,
  franquia_nome TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.produto_id,
    m.deposito_id,
    m.user_id,
    m.cliente_id,
    m.cliente_filial_id,
    m.lote,
    SUM(
      CASE 
        WHEN m.tipo_movimentacao IN ('entrada', 'ajuste_entrada') THEN m.quantidade
        WHEN m.tipo_movimentacao IN ('saida', 'ajuste_saida') THEN -m.quantidade
        ELSE 0
      END
    ) as quantidade_atual,
    AVG(m.valor_unitario) as valor_unitario,
    SUM(
      CASE 
        WHEN m.tipo_movimentacao IN ('entrada', 'ajuste_entrada') THEN m.quantidade * m.valor_unitario
        WHEN m.tipo_movimentacao IN ('saida', 'ajuste_saida') THEN -m.quantidade * m.valor_unitario
        ELSE 0
      END
    ) as valor_total,
    jsonb_build_object(
      'nome', p.nome,
      'codigo', p.codigo,
      'unidade_medida', p.unidade_medida
    ) as produtos,
    f.nome as franquia_nome
  FROM movimentacoes m
  LEFT JOIN produtos p ON p.id = m.produto_id
  LEFT JOIN franquias f ON f.id = m.deposito_id
  GROUP BY m.produto_id, m.deposito_id, m.user_id, m.cliente_id, m.cliente_filial_id, m.lote, p.nome, p.codigo, p.unidade_medida, f.nome
  HAVING SUM(
    CASE 
      WHEN m.tipo_movimentacao IN ('entrada', 'ajuste_entrada') THEN m.quantidade
      WHEN m.tipo_movimentacao IN ('saida', 'ajuste_saida') THEN -m.quantidade
      ELSE 0
    END
  ) > 0;
END;
$$ LANGUAGE plpgsql;

-- FASE 4: Adaptar Entradas e Saídas
-- Adicionar campos na tabela entradas
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS cliente_filial_id UUID REFERENCES cliente_filiais(id);

CREATE INDEX IF NOT EXISTS idx_entradas_cliente ON entradas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entradas_filial ON entradas(cliente_filial_id);

-- Migrar dados: popular cliente_id nas entradas existentes
UPDATE entradas e
SET cliente_id = cu.cliente_id
FROM cliente_usuarios cu
WHERE e.user_id = cu.user_id
  AND cu.ativo = true
  AND e.cliente_id IS NULL;

-- Adicionar campos na tabela saidas
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS cliente_origem_id UUID REFERENCES clientes(id);
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS cliente_filial_origem_id UUID REFERENCES cliente_filiais(id);
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS tipo_destino VARCHAR(50);
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS cliente_filial_destino_id UUID REFERENCES cliente_filiais(id);

-- Adicionar constraints após a coluna existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_tipo_destino'
  ) THEN
    ALTER TABLE saidas ADD CONSTRAINT check_tipo_destino 
      CHECK (tipo_destino IN ('fazenda', 'cliente_filial', 'externo', NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saidas_cliente_origem ON saidas(cliente_origem_id);
CREATE INDEX IF NOT EXISTS idx_saidas_filial_origem ON saidas(cliente_filial_origem_id);
CREATE INDEX IF NOT EXISTS idx_saidas_filial_destino ON saidas(cliente_filial_destino_id);
CREATE INDEX IF NOT EXISTS idx_saidas_tipo_destino ON saidas(tipo_destino);

-- Migrar dados: popular cliente_origem_id nas saídas existentes
UPDATE saidas s
SET cliente_origem_id = cu.cliente_id
FROM cliente_usuarios cu
WHERE s.user_id = cu.user_id
  AND cu.ativo = true
  AND s.cliente_origem_id IS NULL;

-- Definir tipo_destino baseado em dados existentes
UPDATE saidas 
SET tipo_destino = CASE
  WHEN fazenda_id IS NOT NULL THEN 'fazenda'
  ELSE 'externo'
END
WHERE tipo_destino IS NULL;