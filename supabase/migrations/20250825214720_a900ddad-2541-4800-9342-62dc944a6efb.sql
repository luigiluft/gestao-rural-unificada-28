-- Limpar dados antigos de ondas de alocação
DELETE FROM public.allocation_wave_items;
DELETE FROM public.allocation_waves;

-- Criar tabela allocation_wave_pallets
CREATE TABLE public.allocation_wave_pallets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wave_id UUID NOT NULL,
    entrada_pallet_id UUID NOT NULL,
    codigo_barras_pallet TEXT NOT NULL UNIQUE,
    posicao_id UUID NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'alocado', 'com_divergencia')),
    produtos_conferidos JSONB DEFAULT '[]'::jsonb,
    divergencias JSONB DEFAULT '[]'::jsonb,
    data_alocacao TIMESTAMP WITH TIME ZONE NULL,
    alocado_por UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.allocation_wave_pallets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para allocation_wave_pallets
CREATE POLICY "Users with wave access can manage pallet items"
ON public.allocation_wave_pallets
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM allocation_waves w 
        WHERE w.id = allocation_wave_pallets.wave_id 
        AND (
            EXISTS (SELECT 1 FROM franquias f WHERE f.id = w.deposito_id AND f.master_franqueado_id = auth.uid())
            OR has_role(auth.uid(), 'admin'::app_role)
            OR auth.uid() = w.funcionario_id
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM allocation_waves w 
        WHERE w.id = allocation_wave_pallets.wave_id 
        AND (
            EXISTS (SELECT 1 FROM franquias f WHERE f.id = w.deposito_id AND f.master_franqueado_id = auth.uid())
            OR has_role(auth.uid(), 'admin'::app_role)
            OR auth.uid() = w.funcionario_id
        )
    )
);

-- Função para gerar código de barras de pallet
CREATE OR REPLACE FUNCTION public.generate_pallet_barcode(p_entrada_id UUID, p_numero_pallet INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'PALLET-' || SUBSTRING(p_entrada_id::TEXT, 1, 8) || '-' || LPAD(p_numero_pallet::TEXT, 3, '0');
END;
$$;

-- Atualizar pallets existentes com códigos de barras
UPDATE public.entrada_pallets 
SET descricao = public.generate_pallet_barcode(entrada_id, numero_pallet)
WHERE descricao IS NULL OR descricao = '';

-- Função para criar ondas de alocação baseadas em pallets
CREATE OR REPLACE FUNCTION public.create_allocation_wave_on_entrada_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wave_id UUID;
    v_wave_number TEXT;
    pallet_record RECORD;
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
        
        -- Create allocation wave pallets for each entrada pallet
        FOR pallet_record IN 
            SELECT * FROM public.entrada_pallets ep 
            WHERE ep.entrada_id = NEW.id
        LOOP
            -- Gerar código de barras se não existir
            IF pallet_record.descricao IS NULL OR pallet_record.descricao = '' THEN
                UPDATE public.entrada_pallets 
                SET descricao = public.generate_pallet_barcode(NEW.id, pallet_record.numero_pallet)
                WHERE id = pallet_record.id;
                
                pallet_record.descricao := public.generate_pallet_barcode(NEW.id, pallet_record.numero_pallet);
            END IF;
            
            INSERT INTO public.allocation_wave_pallets (
                wave_id,
                entrada_pallet_id,
                codigo_barras_pallet
            ) VALUES (
                v_wave_id,
                pallet_record.id,
                pallet_record.descricao
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Função para completar alocação de pallet e criar estoque
CREATE OR REPLACE FUNCTION public.complete_pallet_allocation_and_create_stock(
    p_wave_pallet_id UUID,
    p_posicao_id UUID,
    p_barcode_pallet TEXT,
    p_barcode_posicao TEXT,
    p_produtos_conferidos JSONB,
    p_divergencias JSONB DEFAULT '[]'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_pallet RECORD;
    v_position_record RECORD;
    v_wave_id UUID;
    v_pending_pallets_count INTEGER;
    v_entrada RECORD;
    produto_conf RECORD;
    v_existing_estoque_id UUID;
    v_produto_id UUID;
    v_quantidade_conferida NUMERIC;
BEGIN
    -- Get wave pallet details
    SELECT 
        wp.*,
        w.deposito_id,
        ep.entrada_id,
        ep.numero_pallet
    INTO v_pallet
    FROM public.allocation_wave_pallets wp
    JOIN public.allocation_waves w ON w.id = wp.wave_id
    JOIN public.entrada_pallets ep ON ep.id = wp.entrada_pallet_id
    WHERE wp.id = p_wave_pallet_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wave pallet not found';
    END IF;
    
    -- Store wave_id for later use
    v_wave_id := v_pallet.wave_id;
    
    -- Get entrada details
    SELECT e.*, p.user_id 
    INTO v_entrada
    FROM public.entradas e
    JOIN public.profiles p ON p.user_id = e.user_id
    WHERE e.id = v_pallet.entrada_id;
    
    -- Check position status
    SELECT 
        ocupado,
        reservado_temporariamente,
        reservado_por_wave_id,
        codigo
    INTO v_position_record
    FROM public.storage_positions
    WHERE id = p_posicao_id AND ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Storage position not found or inactive';
    END IF;
    
    -- Validate position availability
    IF v_position_record.ocupado = true THEN
        RAISE EXCEPTION 'Esta posição já está ocupada. Código: %', v_position_record.codigo;
    END IF;
    
    -- Update wave pallet as allocated
    UPDATE public.allocation_wave_pallets
    SET 
        posicao_id = p_posicao_id,
        status = CASE 
            WHEN jsonb_array_length(p_divergencias) > 0 THEN 'com_divergencia'
            ELSE 'alocado'
        END,
        produtos_conferidos = p_produtos_conferidos,
        divergencias = p_divergencias,
        data_alocacao = now(),
        alocado_por = auth.uid(),
        updated_at = now()
    WHERE id = p_wave_pallet_id;
    
    -- Mark position as occupied
    UPDATE public.storage_positions
    SET 
        ocupado = true,
        reservado_temporariamente = false,
        reservado_ate = NULL,
        reservado_por_wave_id = NULL,
        updated_at = now()
    WHERE id = p_posicao_id;
    
    -- Process each confirmed product to create stock entries
    FOR produto_conf IN 
        SELECT 
            (item->>'produto_id')::UUID as produto_id,
            (item->>'quantidade_conferida')::NUMERIC as quantidade_conferida,
            item->>'lote' as lote,
            (item->>'valor_unitario')::NUMERIC as valor_unitario,
            (item->>'data_validade')::DATE as data_validade
        FROM jsonb_array_elements(p_produtos_conferidos) as item
        WHERE (item->>'status') = 'conferido'
    LOOP
        -- Check if there's already an estoque entry for this product/deposito/lote/posicao combination
        SELECT id INTO v_existing_estoque_id
        FROM public.estoque
        WHERE produto_id = produto_conf.produto_id 
          AND deposito_id = v_pallet.deposito_id 
          AND posicao_id = p_posicao_id
          AND COALESCE(lote, '') = COALESCE(produto_conf.lote, '')
          AND user_id = v_entrada.user_id;

        IF v_existing_estoque_id IS NOT NULL THEN
            -- Update existing stock
            UPDATE public.estoque
            SET 
                quantidade_atual = quantidade_atual + produto_conf.quantidade_conferida,
                valor_medio = CASE 
                    WHEN quantidade_atual > 0 THEN 
                        ((valor_medio * quantidade_atual) + (produto_conf.valor_unitario * produto_conf.quantidade_conferida)) / (quantidade_atual + produto_conf.quantidade_conferida)
                    ELSE 
                        produto_conf.valor_unitario
                END,
                updated_at = now()
            WHERE id = v_existing_estoque_id;
        ELSE
            -- Create new stock entry
            INSERT INTO public.estoque (
                user_id,
                produto_id,
                deposito_id,
                posicao_id,
                quantidade_atual,
                quantidade_reservada,
                valor_medio,
                lote,
                data_validade
            ) VALUES (
                v_entrada.user_id,
                produto_conf.produto_id,
                v_pallet.deposito_id,
                p_posicao_id,
                produto_conf.quantidade_conferida,
                0,
                produto_conf.valor_unitario,
                produto_conf.lote,
                produto_conf.data_validade
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
            v_entrada.user_id,
            produto_conf.produto_id,
            v_pallet.deposito_id,
            'entrada',
            produto_conf.quantidade_conferida,
            produto_conf.valor_unitario,
            v_wave_id,
            'allocation_wave_pallet',
            produto_conf.lote,
            'Entrada de estoque via alocação de pallet - Posição: ' || p_barcode_posicao || ' - Pallet: ' || p_barcode_pallet,
            now()
        );
    END LOOP;

    -- Check if all pallets in the wave are now allocated
    SELECT COUNT(*) INTO v_pending_pallets_count
    FROM public.allocation_wave_pallets
    WHERE wave_id = v_wave_id 
      AND status = 'pendente';
    
    -- If no pending pallets remain, mark wave as completed
    IF v_pending_pallets_count = 0 THEN
        UPDATE public.allocation_waves
        SET 
            status = 'concluido',
            data_conclusao = now()
        WHERE id = v_wave_id;
        
        RAISE LOG 'Wave % marked as completed - all pallets allocated', v_wave_id;
    END IF;

    RETURN TRUE;
END;
$$;