-- Fix product duplication by making codes globally unique
-- Step 1: Update find_or_create_produto function to search globally by code

CREATE OR REPLACE FUNCTION public.find_or_create_produto(
  p_user_id uuid, 
  p_nome_produto text, 
  p_codigo_ean text DEFAULT NULL::text, 
  p_codigo_produto text DEFAULT NULL::text, 
  p_unidade_comercial text DEFAULT 'UN'::text, 
  p_descricao_produto text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_produto_id UUID;
  v_produto_nome TEXT;
  v_produto_codigo TEXT;
BEGIN
  -- Sanitizar o nome do produto
  v_produto_nome := COALESCE(TRIM(p_nome_produto), TRIM(p_descricao_produto), 'Produto Sem Nome');
  
  -- Determinar o código do produto (priorizar EAN, depois código_produto)
  v_produto_codigo := COALESCE(NULLIF(TRIM(p_codigo_ean), ''), NULLIF(TRIM(p_codigo_produto), ''));
  
  -- PRIMEIRA PRIORIDADE: Buscar por código GLOBALMENTE (sem filtrar por user_id)
  IF v_produto_codigo IS NOT NULL THEN
    SELECT id INTO v_produto_id
    FROM public.produtos
    WHERE UPPER(TRIM(COALESCE(codigo, ''))) = UPPER(TRIM(v_produto_codigo))
      AND ativo = true
    ORDER BY created_at ASC  -- Priorizar o mais antigo
    LIMIT 1;
    
    IF v_produto_id IS NOT NULL THEN
      RAISE LOG 'Produto encontrado por código globalmente: % (ID: %)', v_produto_nome, v_produto_id;
      RETURN v_produto_id;
    END IF;
  END IF;
  
  -- SEGUNDA PRIORIDADE: Buscar por nome (apenas do mesmo usuário)
  SELECT id INTO v_produto_id
  FROM public.produtos
  WHERE user_id = p_user_id 
    AND UPPER(TRIM(nome)) = UPPER(TRIM(v_produto_nome))
    AND ativo = true
  ORDER BY created_at ASC  -- Priorizar o mais antigo
  LIMIT 1;
  
  IF v_produto_id IS NOT NULL THEN
    RAISE LOG 'Produto encontrado por nome do usuário: % (ID: %)', v_produto_nome, v_produto_id;
    RETURN v_produto_id;
  END IF;
  
  -- TERCEIRA PRIORIDADE: Criar novo produto
  INSERT INTO public.produtos (
    user_id,
    nome,
    codigo,
    unidade_medida,
    descricao,
    ativo
  ) VALUES (
    p_user_id,
    v_produto_nome,
    v_produto_codigo,
    COALESCE(NULLIF(TRIM(p_unidade_comercial), ''), 'UN'),
    COALESCE(NULLIF(TRIM(p_descricao_produto), ''), v_produto_nome),
    true
  ) RETURNING id INTO v_produto_id;
  
  RAISE LOG 'Produto criado: % (ID: %)', v_produto_nome, v_produto_id;
  RETURN v_produto_id;
END;
$function$;

-- Step 2: Clean existing duplicates
-- Find and merge duplicate products by code
DO $$
DECLARE
    duplicate_group RECORD;
    oldest_product_id UUID;
    duplicate_product RECORD;
    affected_count INTEGER := 0;
BEGIN
    -- For each group of products with the same code (excluding nulls and empty strings)
    FOR duplicate_group IN 
        SELECT codigo, COUNT(*) as count_duplicates
        FROM public.produtos 
        WHERE codigo IS NOT NULL 
          AND TRIM(codigo) != ''
          AND ativo = true
        GROUP BY UPPER(TRIM(codigo))
        HAVING COUNT(*) > 1
    LOOP
        -- Get the oldest product (keep this one)
        SELECT id INTO oldest_product_id
        FROM public.produtos
        WHERE UPPER(TRIM(COALESCE(codigo, ''))) = UPPER(TRIM(duplicate_group.codigo))
          AND ativo = true
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Update all references from newer duplicates to the oldest one
        FOR duplicate_product IN 
            SELECT id
            FROM public.produtos
            WHERE UPPER(TRIM(COALESCE(codigo, ''))) = UPPER(TRIM(duplicate_group.codigo))
              AND ativo = true
              AND id != oldest_product_id
        LOOP
            -- Update entrada_itens references
            UPDATE public.entrada_itens 
            SET produto_id = oldest_product_id 
            WHERE produto_id = duplicate_product.id;
            
            -- Update estoque references  
            UPDATE public.estoque 
            SET produto_id = oldest_product_id 
            WHERE produto_id = duplicate_product.id;
            
            -- Update movimentacoes references
            UPDATE public.movimentacoes 
            SET produto_id = oldest_product_id 
            WHERE produto_id = duplicate_product.id;
            
            -- Update allocation_wave_items references
            UPDATE public.allocation_wave_items 
            SET produto_id = oldest_product_id 
            WHERE produto_id = duplicate_product.id;
            
            -- Update inventario_itens references
            UPDATE public.inventario_itens 
            SET produto_id = oldest_product_id 
            WHERE produto_id = duplicate_product.id;
            
            -- Update inventario_divergencias references
            UPDATE public.inventario_divergencias 
            SET produto_id = oldest_product_id 
            WHERE produto_id = duplicate_product.id;
            
            -- Mark duplicate as inactive (soft delete)
            UPDATE public.produtos 
            SET ativo = false, 
                updated_at = now(),
                nome = nome || ' [DUPLICATA REMOVIDA]'
            WHERE id = duplicate_product.id;
            
            affected_count := affected_count + 1;
            
            RAISE LOG 'Produto duplicado % marcado como inativo, referencias movidas para %', 
                duplicate_product.id, oldest_product_id;
        END LOOP;
    END LOOP;
    
    RAISE LOG 'Limpeza concluída: % produtos duplicados processados', affected_count;
END $$;