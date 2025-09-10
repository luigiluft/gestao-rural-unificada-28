-- Criar tabela para gerenciar reservas de estoque
CREATE TABLE public.estoque_reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  saida_id UUID NOT NULL,
  produto_id UUID NOT NULL, 
  deposito_id UUID NOT NULL,
  quantidade_reservada NUMERIC NOT NULL CHECK (quantidade_reservada > 0),
  lote TEXT,
  data_validade DATE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT estoque_reservas_saida_produto_unique UNIQUE (saida_id, produto_id, lote)
);

-- Enable RLS
ALTER TABLE public.estoque_reservas ENABLE ROW LEVEL SECURITY;

-- Create policies for estoque_reservas
CREATE POLICY "Users can view their own reservations" 
ON public.estoque_reservas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" 
ON public.estoque_reservas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.estoque_reservas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations" 
ON public.estoque_reservas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Franqueados can view reservations in their deposits
CREATE POLICY "Franqueados can view reservations in their deposits" 
ON public.estoque_reservas 
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND deposito_id IN (
    SELECT f.id FROM franquias f 
    WHERE f.master_franqueado_id = auth.uid()
  )
);

-- Admins can manage all reservations
CREATE POLICY "Admins can manage all reservations" 
ON public.estoque_reservas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_estoque_reservas_updated_at
BEFORE UPDATE ON public.estoque_reservas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically clear reservations when saida is completed
CREATE OR REPLACE FUNCTION public.clear_reservations_on_saida_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear reservations when saida moves to 'separado' or completed statuses
    IF NEW.status IN ('separado', 'expedido', 'entregue') AND OLD.status != NEW.status THEN
        DELETE FROM public.estoque_reservas 
        WHERE saida_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clear reservations automatically
CREATE TRIGGER clear_reservations_on_saida_completion
AFTER UPDATE ON public.saidas
FOR EACH ROW
EXECUTE FUNCTION public.clear_reservations_on_saida_completion();

-- Update the estoque materialized view to include reserved quantities
DROP MATERIALIZED VIEW IF EXISTS public.estoque;

CREATE MATERIALIZED VIEW public.estoque AS
WITH movimentacao_totals AS (
  SELECT 
    m.user_id,
    m.produto_id,
    m.deposito_id,
    SUM(m.quantidade) AS quantidade_total,
    MAX(m.data_movimentacao) AS ultima_movimentacao,
    STRING_AGG(DISTINCT m.lote, ', ') AS lotes
  FROM public.movimentacoes m
  GROUP BY m.user_id, m.produto_id, m.deposito_id
),
reserva_totals AS (
  SELECT 
    er.produto_id,
    er.deposito_id,
    SUM(er.quantidade_reservada) AS quantidade_reservada_total
  FROM public.estoque_reservas er
  GROUP BY er.produto_id, er.deposito_id
)
SELECT 
  gen_random_uuid() AS id,
  mt.user_id,
  mt.produto_id,
  mt.deposito_id,
  mt.quantidade_total AS quantidade_atual,
  COALESCE(rt.quantidade_reservada_total, 0) AS quantidade_reservada,
  (mt.quantidade_total - COALESCE(rt.quantidade_reservada_total, 0)) AS quantidade_disponivel,
  p.nome AS produto_nome,
  p.codigo AS produto_codigo,
  p.unidade_medida,
  f.nome AS franquia_nome,
  mt.lotes,
  mt.ultima_movimentacao,
  CASE 
    WHEN mt.quantidade_total <= 0 THEN 'sem_estoque'
    WHEN mt.quantidade_total <= 10 THEN 'critico'
    WHEN mt.quantidade_total <= 50 THEN 'baixo'
    ELSE 'normal'
  END AS status_estoque,
  mt.quantidade_total * 
    COALESCE((
      SELECT AVG(valor_unitario) 
      FROM movimentacoes m2 
      WHERE m2.produto_id = mt.produto_id 
        AND m2.deposito_id = mt.deposito_id
        AND m2.valor_unitario > 0
    ), 0) AS valor_total_estoque
FROM movimentacao_totals mt
JOIN produtos p ON p.id = mt.produto_id
JOIN franquias f ON f.id = mt.deposito_id
LEFT JOIN reserva_totals rt ON rt.produto_id = mt.produto_id AND rt.deposito_id = mt.deposito_id
WHERE mt.quantidade_total > 0;

-- Create unique index for performance
CREATE UNIQUE INDEX idx_estoque_unique ON public.estoque (user_id, produto_id, deposito_id);
CREATE INDEX idx_estoque_produto ON public.estoque (produto_id);
CREATE INDEX idx_estoque_deposito ON public.estoque (deposito_id);
CREATE INDEX idx_estoque_status ON public.estoque (status_estoque);

-- Create indexes for estoque_reservas
CREATE INDEX idx_estoque_reservas_saida ON public.estoque_reservas (saida_id);
CREATE INDEX idx_estoque_reservas_produto ON public.estoque_reservas (produto_id);
CREATE INDEX idx_estoque_reservas_deposito ON public.estoque_reservas (deposito_id);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW public.estoque;