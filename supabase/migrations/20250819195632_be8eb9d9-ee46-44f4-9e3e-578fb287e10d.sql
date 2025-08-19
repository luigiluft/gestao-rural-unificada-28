-- Create tables for inventory management
CREATE TYPE inventory_status AS ENUM ('iniciado', 'em_andamento', 'concluido', 'cancelado');

-- Main inventory table
CREATE TABLE public.inventarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_inventario TEXT NOT NULL UNIQUE,
    deposito_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status inventory_status NOT NULL DEFAULT 'iniciado',
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_conclusao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    total_posicoes INTEGER DEFAULT 0,
    posicoes_conferidas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Inventory positions (which positions are being inventoried)
CREATE TABLE public.inventario_posicoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID NOT NULL,
    posicao_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, concluida
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    conferido_por UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(inventario_id, posicao_id)
);

-- Inventory items found during scanning
CREATE TABLE public.inventario_itens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID NOT NULL,
    posicao_id UUID NOT NULL,
    produto_id UUID,
    lote TEXT,
    codigo_barras TEXT,
    quantidade_encontrada NUMERIC NOT NULL DEFAULT 0,
    quantidade_sistema NUMERIC NOT NULL DEFAULT 0,
    diferenca NUMERIC GENERATED ALWAYS AS (quantidade_encontrada - quantidade_sistema) STORED,
    valor_unitario NUMERIC,
    observacoes TEXT,
    scaneado_por UUID,
    data_escaneamento TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory divergencies report
CREATE TABLE public.inventario_divergencias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID NOT NULL,
    posicao_id UUID NOT NULL,
    produto_id UUID,
    lote TEXT,
    quantidade_sistema NUMERIC NOT NULL,
    quantidade_encontrada NUMERIC NOT NULL,
    diferenca NUMERIC NOT NULL,
    tipo_divergencia TEXT NOT NULL, -- sobra, falta, produto_nao_cadastrado
    valor_impacto NUMERIC,
    justificativa TEXT,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovada, rejeitada
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_posicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_divergencias ENABLE ROW LEVEL SECURITY;

-- Inventarios policies
CREATE POLICY "Users can manage their own inventories" ON public.inventarios
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Franqueados can manage inventories in their deposits" ON public.inventarios
FOR ALL USING (
    has_role(auth.uid(), 'franqueado') AND 
    deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())
) WITH CHECK (
    has_role(auth.uid(), 'franqueado') AND 
    deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())
);

CREATE POLICY "Admins can manage all inventories" ON public.inventarios
FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Inventario posicoes policies  
CREATE POLICY "Users can manage positions for their inventories" ON public.inventario_posicoes
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM inventarios i 
        WHERE i.id = inventario_posicoes.inventario_id 
        AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
             (has_role(auth.uid(), 'franqueado') AND i.deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())))
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM inventarios i 
        WHERE i.id = inventario_posicoes.inventario_id 
        AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
             (has_role(auth.uid(), 'franqueado') AND i.deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())))
    )
);

-- Inventario itens policies
CREATE POLICY "Users can manage items for their inventories" ON public.inventario_itens
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM inventarios i 
        WHERE i.id = inventario_itens.inventario_id 
        AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
             (has_role(auth.uid(), 'franqueado') AND i.deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())))
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM inventarios i 
        WHERE i.id = inventario_itens.inventario_id 
        AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
             (has_role(auth.uid(), 'franqueado') AND i.deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())))
    )
);

-- Inventario divergencias policies
CREATE POLICY "Users can manage divergencies for their inventories" ON public.inventario_divergencias
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM inventarios i 
        WHERE i.id = inventario_divergencias.inventario_id 
        AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
             (has_role(auth.uid(), 'franqueado') AND i.deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())))
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM inventarios i 
        WHERE i.id = inventario_divergencias.inventario_id 
        AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
             (has_role(auth.uid(), 'franqueado') AND i.deposito_id IN (SELECT id FROM franquias WHERE master_franqueado_id = auth.uid())))
    )
);

-- Create triggers for updated_at
CREATE TRIGGER update_inventarios_updated_at
    BEFORE UPDATE ON public.inventarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate inventory number
CREATE OR REPLACE FUNCTION generate_inventory_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
    inv_number TEXT;
BEGIN
    -- Get next number for today
    SELECT COALESCE(MAX(
        CASE 
            WHEN numero_inventario ~ '^INV-[0-9]{8}-[0-9]+$' 
            THEN (regexp_match(numero_inventario, '^INV-[0-9]{8}-([0-9]+)$'))[1]::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM inventarios
    WHERE DATE(created_at) = CURRENT_DATE;
    
    inv_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_num::TEXT, 3, '0');
    
    RETURN inv_number;
END;
$$;