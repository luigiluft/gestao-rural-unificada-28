-- Adicionar campos para confirmação de alocação na tabela pallet_positions
ALTER TABLE public.pallet_positions 
ADD COLUMN IF NOT EXISTS codigo_barras_pallet text,
ADD COLUMN IF NOT EXISTS codigo_barras_posicao text,
ADD COLUMN IF NOT EXISTS confirmado_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS confirmado_por uuid,
ADD COLUMN IF NOT EXISTS metodo_confirmacao text CHECK (metodo_confirmacao IN ('manual', 'scanner'));

-- Primeiro, verificar se o tipo já existe
DO $$ 
BEGIN
    -- Tentar adicionar novo valor ao enum se o tipo existir
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pallet_status') THEN
        -- Adicionar novo valor se não existir
        BEGIN
            ALTER TYPE pallet_status ADD VALUE 'alocado_pendente_confirmacao';
        EXCEPTION WHEN duplicate_object THEN
            -- Valor já existe, continuar
            NULL;
        END;
    ELSE
        -- Criar o tipo se não existir
        CREATE TYPE pallet_status AS ENUM ('pendente', 'alocado_pendente_confirmacao', 'alocado', 'removido');
    END IF;
END $$;

-- Alterar coluna status para usar o novo tipo se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pallet_positions' 
        AND column_name = 'status' 
        AND udt_name = 'pallet_status'
    ) THEN
        -- Remover default temporariamente
        ALTER TABLE public.pallet_positions ALTER COLUMN status DROP DEFAULT;
        
        -- Alterar tipo
        ALTER TABLE public.pallet_positions 
        ALTER COLUMN status TYPE pallet_status USING status::pallet_status;
        
        -- Recolocar default
        ALTER TABLE public.pallet_positions ALTER COLUMN status SET DEFAULT 'alocado'::pallet_status;
    END IF;
END $$;

-- Criar função para confirmar alocação de pallet
CREATE OR REPLACE FUNCTION public.confirm_pallet_allocation(
    p_pallet_id uuid,
    p_metodo_confirmacao text,
    p_codigo_barras_pallet text DEFAULT NULL,
    p_codigo_barras_posicao text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_position_record RECORD;
BEGIN
    -- Buscar informações da alocação
    SELECT pp.*, sp.codigo as codigo_posicao, ep.descricao as codigo_pallet
    INTO v_position_record
    FROM pallet_positions pp
    JOIN storage_positions sp ON sp.id = pp.posicao_id
    JOIN entrada_pallets ep ON ep.id = pp.pallet_id
    WHERE pp.pallet_id = p_pallet_id 
    AND pp.status = 'alocado_pendente_confirmacao';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pallet não encontrado ou não está pendente de confirmação';
    END IF;
    
    -- Se for confirmação por scanner, validar códigos de barras
    IF p_metodo_confirmacao = 'scanner' THEN
        IF p_codigo_barras_pallet IS NULL OR p_codigo_barras_posicao IS NULL THEN
            RAISE EXCEPTION 'Códigos de barras são obrigatórios para confirmação por scanner';
        END IF;
        
        -- Validar código do pallet
        IF v_position_record.codigo_pallet != p_codigo_barras_pallet THEN
            RAISE EXCEPTION 'Código de barras do pallet não confere. Esperado: %, Escaneado: %', 
                v_position_record.codigo_pallet, p_codigo_barras_pallet;
        END IF;
        
        -- Validar código da posição
        IF v_position_record.codigo_posicao != p_codigo_barras_posicao THEN
            RAISE EXCEPTION 'Código de barras da posição não confere. Esperado: %, Escaneado: %', 
                v_position_record.codigo_posicao, p_codigo_barras_posicao;
        END IF;
    END IF;
    
    -- Atualizar pallet_position como confirmado
    UPDATE public.pallet_positions
    SET 
        status = 'alocado',
        confirmado_em = now(),
        confirmado_por = auth.uid(),
        metodo_confirmacao = p_metodo_confirmacao,
        codigo_barras_pallet = p_codigo_barras_pallet,
        codigo_barras_posicao = p_codigo_barras_posicao,
        updated_at = now()
    WHERE pallet_id = p_pallet_id;
    
    RETURN TRUE;
END;
$function$;

-- Criar função RPC para alocação automática sem criar estoque
CREATE OR REPLACE FUNCTION public.allocate_pallet_to_position_pending(
    p_pallet_id uuid,
    p_deposito_id uuid,
    p_observacoes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_position_id uuid;
    v_position_codigo text;
    v_pallet_numero integer;
    v_pallet_descricao text;
BEGIN
    -- Buscar informações do pallet
    SELECT ep.numero_pallet, ep.descricao
    INTO v_pallet_numero, v_pallet_descricao
    FROM entrada_pallets ep
    WHERE ep.id = p_pallet_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pallet não encontrado';
    END IF;
    
    -- Gerar código de barras se não existir
    IF v_pallet_descricao IS NULL OR v_pallet_descricao = '' THEN
        v_pallet_descricao := 'PALLET-' || SUBSTRING(p_pallet_id::TEXT, 1, 8) || '-' || LPAD(v_pallet_numero::TEXT, 3, '0');
        
        UPDATE entrada_pallets 
        SET descricao = v_pallet_descricao
        WHERE id = p_pallet_id;
    END IF;
    
    -- Encontrar primeira posição disponível
    SELECT id, codigo INTO v_position_id, v_position_codigo
    FROM storage_positions 
    WHERE deposito_id = p_deposito_id 
    AND ativo = true 
    AND ocupado = false
    ORDER BY codigo
    LIMIT 1;
    
    IF v_position_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma posição disponível encontrada no depósito';
    END IF;
    
    -- Inserir ou atualizar pallet_position com status pendente
    INSERT INTO pallet_positions (
        pallet_id,
        posicao_id,
        status,
        observacoes,
        alocado_por
    ) VALUES (
        p_pallet_id,
        v_position_id,
        'alocado_pendente_confirmacao',
        p_observacoes,
        auth.uid()
    )
    ON CONFLICT (pallet_id) DO UPDATE SET
        posicao_id = v_position_id,
        status = 'alocado_pendente_confirmacao',
        observacoes = p_observacoes,
        alocado_por = auth.uid(),
        updated_at = now();
    
    RETURN jsonb_build_object(
        'success', true,
        'pallet_id', p_pallet_id,
        'posicao_id', v_position_id,
        'posicao_codigo', v_position_codigo,
        'pallet_codigo', v_pallet_descricao
    );
END;
$function$;