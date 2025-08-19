-- Create storage positions table for warehouse locations
CREATE TABLE public.storage_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deposito_id UUID NOT NULL,
  codigo TEXT NOT NULL, -- Position code (e.g., A01-01-01)
  descricao TEXT,
  tipo_posicao TEXT DEFAULT 'prateleira', -- prateleira, pallet, container
  capacidade_maxima NUMERIC,
  ocupado BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deposito_id, codigo)
);

-- Create allocation waves table
CREATE TABLE public.allocation_waves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_onda TEXT NOT NULL,
  deposito_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, concluida
  funcionario_id UUID,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create allocation wave items table
CREATE TABLE public.allocation_wave_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wave_id UUID NOT NULL,
  entrada_item_id UUID NOT NULL,
  produto_id UUID NOT NULL,
  lote TEXT,
  quantidade NUMERIC NOT NULL,
  quantidade_alocada NUMERIC DEFAULT 0,
  posicao_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, alocado
  barcode_produto TEXT,
  barcode_posicao TEXT,
  data_alocacao TIMESTAMP WITH TIME ZONE,
  alocado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.storage_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_wave_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for storage_positions
CREATE POLICY "Franqueados can manage positions in their deposits" ON public.storage_positions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.franquias f
    WHERE f.id = storage_positions.deposito_id 
    AND f.master_franqueado_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.franquias f
    WHERE f.id = storage_positions.deposito_id 
    AND f.master_franqueado_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all positions" ON public.storage_positions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for allocation_waves
CREATE POLICY "Franqueados can manage waves in their deposits" ON public.allocation_waves
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.franquias f
    WHERE f.id = allocation_waves.deposito_id 
    AND f.master_franqueado_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.franquias f
    WHERE f.id = allocation_waves.deposito_id 
    AND f.master_franqueado_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all waves" ON public.allocation_waves
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view waves they are assigned to" ON public.allocation_waves
FOR SELECT USING (auth.uid() = funcionario_id);

-- RLS Policies for allocation_wave_items
CREATE POLICY "Users with wave access can manage items" ON public.allocation_wave_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.allocation_waves w
    WHERE w.id = allocation_wave_items.wave_id
    AND (
      EXISTS (
        SELECT 1 FROM public.franquias f
        WHERE f.id = w.deposito_id 
        AND f.master_franqueado_id = auth.uid()
      )
      OR has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid() = w.funcionario_id
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.allocation_waves w
    WHERE w.id = allocation_wave_items.wave_id
    AND (
      EXISTS (
        SELECT 1 FROM public.franquias f
        WHERE f.id = w.deposito_id 
        AND f.master_franqueado_id = auth.uid()
      )
      OR has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid() = w.funcionario_id
    )
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_storage_positions_updated_at
BEFORE UPDATE ON public.storage_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allocation_waves_updated_at
BEFORE UPDATE ON public.allocation_waves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allocation_wave_items_updated_at
BEFORE UPDATE ON public.allocation_wave_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Modify the entrada item trigger to NOT create stock automatically
-- Instead, it will create allocation wave items
DROP TRIGGER IF EXISTS process_entrada_item_trigger ON public.entrada_itens;

CREATE OR REPLACE FUNCTION public.create_allocation_wave_on_entrada_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wave_id UUID;
    v_wave_number TEXT;
    entrada_item RECORD;
BEGIN
    -- Only process if status changed TO 'confirmado'
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao 
       AND NEW.status_aprovacao = 'confirmado' THEN
        
        -- Generate wave number
        v_wave_number := 'WAVE-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
        
        -- Create allocation wave
        INSERT INTO public.allocation_waves (
            numero_onda,
            deposito_id,
            status,
            created_by
        ) VALUES (
            v_wave_number,
            NEW.deposito_id,
            'pendente',
            COALESCE(auth.uid(), NEW.user_id)
        ) RETURNING id INTO v_wave_id;
        
        -- Create allocation wave items for each entrada item
        FOR entrada_item IN 
            SELECT * FROM public.entrada_itens ei 
            WHERE ei.entrada_id = NEW.id
        LOOP
            INSERT INTO public.allocation_wave_items (
                wave_id,
                entrada_item_id,
                produto_id,
                lote,
                quantidade,
                barcode_produto
            ) VALUES (
                v_wave_id,
                entrada_item.id,
                entrada_item.produto_id,
                entrada_item.lote,
                entrada_item.quantidade,
                entrada_item.lote -- Use lote as initial barcode
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for entrada approval
CREATE TRIGGER create_allocation_wave_on_entrada_approved
AFTER UPDATE ON public.entradas
FOR EACH ROW
EXECUTE FUNCTION public.create_allocation_wave_on_entrada_approved();

-- Function to complete allocation and create stock
CREATE OR REPLACE FUNCTION public.complete_allocation_and_create_stock(
    p_wave_item_id UUID,
    p_posicao_id UUID,
    p_barcode_produto TEXT,
    p_barcode_posicao TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_entrada_item RECORD;
    v_existing_estoque_id UUID;
BEGIN
    -- Get wave item details
    SELECT 
        wi.*,
        w.deposito_id,
        ei.user_id,
        ei.valor_unitario,
        ei.data_validade
    INTO v_item
    FROM public.allocation_wave_items wi
    JOIN public.allocation_waves w ON w.id = wi.wave_id
    JOIN public.entrada_itens ei ON ei.id = wi.entrada_item_id
    WHERE wi.id = p_wave_item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wave item not found';
    END IF;
    
    -- Update wave item as allocated
    UPDATE public.allocation_wave_items
    SET 
        posicao_id = p_posicao_id,
        barcode_produto = p_barcode_produto,
        barcode_posicao = p_barcode_posicao,
        quantidade_alocada = quantidade,
        status = 'alocado',
        data_alocacao = now(),
        alocado_por = auth.uid()
    WHERE id = p_wave_item_id;
    
    -- Mark position as occupied
    UPDATE public.storage_positions
    SET ocupado = true, updated_at = now()
    WHERE id = p_posicao_id;
    
    -- Check if there's already an estoque entry for this product/deposito/lote combination
    SELECT id INTO v_existing_estoque_id
    FROM public.estoque
    WHERE produto_id = v_item.produto_id 
      AND deposito_id = v_item.deposito_id 
      AND COALESCE(lote, '') = COALESCE(v_item.lote, '')
      AND user_id = v_item.user_id;

    IF v_existing_estoque_id IS NOT NULL THEN
        -- Update existing stock
        UPDATE public.estoque
        SET 
            quantidade_atual = quantidade_atual + v_item.quantidade,
            valor_medio = CASE 
                WHEN quantidade_atual > 0 THEN 
                    ((valor_medio * quantidade_atual) + (COALESCE(v_item.valor_unitario, 0) * v_item.quantidade)) / (quantidade_atual + v_item.quantidade)
                ELSE 
                    COALESCE(v_item.valor_unitario, 0)
            END,
            updated_at = now()
        WHERE id = v_existing_estoque_id;
    ELSE
        -- Create new stock entry
        INSERT INTO public.estoque (
            user_id,
            produto_id,
            deposito_id,
            quantidade_atual,
            quantidade_reservada,
            valor_medio,
            lote,
            data_validade
        ) VALUES (
            v_item.user_id,
            v_item.produto_id,
            v_item.deposito_id,
            v_item.quantidade,
            0,
            COALESCE(v_item.valor_unitario, 0),
            v_item.lote,
            v_item.data_validade
        );
    END IF;

    -- Create movement record
    INSERT INTO public.movimentacoes (
        user_id,
        produto_id,
        deposito_id,
        tipo_movimentacao,
        quantidade,
        valor_unitario,
        referencia_id,
        referencia_tipo,
        lote,
        observacoes,
        data_movimentacao
    ) VALUES (
        v_item.user_id,
        v_item.produto_id,
        v_item.deposito_id,
        'entrada',
        v_item.quantidade,
        v_item.valor_unitario,
        v_item.wave_id,
        'allocation_wave',
        v_item.lote,
        'Entrada de estoque via alocação - Posição: ' || p_barcode_posicao,
        now()
    );

    RETURN TRUE;
END;
$$;