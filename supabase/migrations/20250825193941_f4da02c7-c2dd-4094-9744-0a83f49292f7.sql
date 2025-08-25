-- Primeiro vamos adicionar o novo valor ao enum
-- Precisamos fazer em transações separadas para evitar o erro
ALTER TYPE entrada_status ADD VALUE 'planejamento';

-- Criar tabela para gerenciar pallets
CREATE TABLE IF NOT EXISTS entrada_pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  numero_pallet INTEGER NOT NULL,
  descricao TEXT,
  peso_total NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(entrada_id, numero_pallet)
);

-- Criar tabela para itens dentro dos pallets
CREATE TABLE IF NOT EXISTS entrada_pallet_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID NOT NULL REFERENCES entrada_pallets(id) ON DELETE CASCADE,
  entrada_item_id UUID NOT NULL REFERENCES entrada_itens(id) ON DELETE CASCADE,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pallet_id, entrada_item_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE entrada_pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrada_pallet_itens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para entrada_pallets
CREATE POLICY "Users can manage pallets for entries they manage" ON entrada_pallets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_pallets.entrada_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entradas e
    WHERE e.id = entrada_pallets.entrada_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
);

-- Políticas RLS para entrada_pallet_itens
CREATE POLICY "Users can manage pallet items for entries they manage" ON entrada_pallet_itens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep
    JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = entrada_pallet_itens.pallet_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entrada_pallets ep
    JOIN entradas e ON e.id = ep.entrada_id
    WHERE ep.id = entrada_pallet_itens.pallet_id
    AND (
      e.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND e.deposito_id IN (
          SELECT f.id FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
      )
    )
  )
);

-- Trigger para updated_at na tabela entrada_pallets
CREATE TRIGGER update_entrada_pallets_updated_at
    BEFORE UPDATE ON entrada_pallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();