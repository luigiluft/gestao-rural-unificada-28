-- Add deposit-related fields to franquias table
ALTER TABLE public.franquias 
ADD COLUMN IF NOT EXISTS capacidade_total numeric,
ADD COLUMN IF NOT EXISTS descricao_deposito text;

-- Migrate existing depositos data to franquias
-- First, create franquias for existing depositos that don't have a franquia yet
INSERT INTO public.franquias (
  nome, 
  master_franqueado_id, 
  capacidade_total, 
  descricao_deposito,
  endereco,
  cidade,
  estado,
  cep,
  telefone,
  email,
  ativo
)
SELECT 
  d.nome || ' - Franquia',
  d.user_id,
  d.capacidade_total,
  d.descricao,
  d.endereco,
  p.cidade,
  p.estado,
  p.cep,
  p.telefone,
  p.email,
  d.ativo
FROM public.depositos d
JOIN public.profiles p ON p.user_id = d.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.franquias f 
  WHERE f.master_franqueado_id = d.user_id
);

-- Update existing entradas to reference franquias instead of depositos
UPDATE public.entradas 
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE entradas.deposito_id = d.id;

-- Update existing estoque to reference franquias instead of depositos  
UPDATE public.estoque
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE estoque.deposito_id = d.id;

-- Update existing saidas to reference franquias instead of depositos
UPDATE public.saidas
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE saidas.deposito_id = d.id;

-- Update existing movimentacoes to reference franquias instead of depositos
UPDATE public.movimentacoes
SET deposito_id = f.id
FROM public.depositos d
JOIN public.franquias f ON f.master_franqueado_id = d.user_id
WHERE movimentacoes.deposito_id = d.id;

-- Update get_producer_available_deposits function to use franquias
CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id uuid)
 RETURNS TABLE(deposito_id uuid, deposito_nome text, franqueado_id uuid, franqueado_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as deposito_id,
    f.nome as deposito_nome,
    p.user_id as franqueado_id,
    p.nome as franqueado_nome
  FROM public.franquias f
  JOIN public.profiles p ON p.user_id = f.master_franqueado_id
  WHERE f.ativo = true
    AND p.role = 'franqueado'
  ORDER BY p.nome, f.nome;
END;
$function$

-- Update process_entrada_item function to work with franquias as depositos
CREATE OR REPLACE FUNCTION public.process_entrada_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    existing_estoque_id UUID;
    v_franqueado_id UUID;
BEGIN
    -- If produto_id is null, try to find or create the product
    IF NEW.produto_id IS NULL THEN
        INSERT INTO public.produtos (
            user_id,
            nome,
            unidade_medida,
            codigo,
            ativo
        ) VALUES (
            NEW.user_id,
            COALESCE(NEW.lote, 'Produto ' || substring(NEW.id::text, 1, 8)),
            'UN',
            NEW.lote,
            true
        ) RETURNING id INTO v_produto_id;
        
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = NEW.id;
        
        NEW.produto_id = v_produto_id;
    ELSE
        v_produto_id = NEW.produto_id;
    END IF;

    -- Get the deposito_id from the entrada
    SELECT e.deposito_id INTO v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- If no deposito_id in entrada, find the first available franquia for this producer
    IF v_deposito_id IS NULL THEN
        -- Find franqueado through hierarchy and use their first franquia
        SELECT f.id, f.master_franqueado_id INTO v_deposito_id, v_franqueado_id
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        JOIN public.franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
        WHERE uh.child_user_id = NEW.user_id
        LIMIT 1;
        
        -- If still no franquia, create a default one for the producer's franqueado
        IF v_deposito_id IS NULL THEN
            -- Find the franqueado for this producer
            SELECT uh.parent_user_id INTO v_franqueado_id
            FROM public.user_hierarchy uh
            JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
            WHERE uh.child_user_id = NEW.user_id
            LIMIT 1;
            
            IF v_franqueado_id IS NOT NULL THEN
                INSERT INTO public.franquias (
                    master_franqueado_id,
                    nome,
                    ativo
                ) VALUES (
                    v_franqueado_id,
                    'Franquia Principal',
                    true
                ) RETURNING id INTO v_deposito_id;
            END IF;
        END IF;
        
        -- Update the entrada with the deposito_id (franquia_id)
        IF v_deposito_id IS NOT NULL THEN
            UPDATE public.entradas 
            SET deposito_id = v_deposito_id 
            WHERE id = NEW.entrada_id;
        END IF;
    END IF;

    -- Check if there's already an estoque entry for this product/franquia/lote combination
    SELECT id INTO existing_estoque_id
    FROM public.estoque
    WHERE produto_id = v_produto_id 
      AND deposito_id = v_deposito_id 
      AND COALESCE(lote, '') = COALESCE(NEW.lote, '')
      AND user_id = NEW.user_id;

    IF existing_estoque_id IS NOT NULL THEN
        UPDATE public.estoque
        SET 
            quantidade_atual = quantidade_atual + NEW.quantidade,
            valor_medio = CASE 
                WHEN quantidade_atual > 0 THEN 
                    ((valor_medio * quantidade_atual) + (COALESCE(NEW.valor_unitario, 0) * NEW.quantidade)) / (quantidade_atual + NEW.quantidade)
                ELSE 
                    COALESCE(NEW.valor_unitario, 0)
            END,
            updated_at = now()
        WHERE id = existing_estoque_id;
    ELSE
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
            NEW.user_id,
            v_produto_id,
            v_deposito_id,
            NEW.quantidade,
            0,
            COALESCE(NEW.valor_unitario, 0),
            NEW.lote,
            NEW.data_validade
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
        NEW.user_id,
        v_produto_id,
        v_deposito_id,
        'entrada',
        NEW.quantidade,
        NEW.valor_unitario,
        NEW.entrada_id,
        'entrada',
        NEW.lote,
        'Entrada de estoque via NFe',
        now()
    );

    RETURN NEW;
END;
$function$

-- Drop the old depositos table after migration is complete
-- (Commented out for safety - can be run manually later)
-- DROP TABLE IF EXISTS public.depositos CASCADE;

-- Remove the old produtor_franqueado_depositos table as it's no longer needed
-- (All producers now have access to all franquias automatically)
-- DROP TABLE IF EXISTS public.produtor_franqueado_depositos CASCADE;