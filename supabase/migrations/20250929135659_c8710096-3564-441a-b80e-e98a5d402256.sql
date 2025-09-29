-- Função final corrigida para migrar divergências existentes do JSON para a tabela divergencias
-- Usando valores válidos de tipo_divergencia conforme constraints
CREATE OR REPLACE FUNCTION migrate_existing_divergencias()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entrada_record RECORD;
  div_item JSONB;
  produto_id_found UUID;
  tipo_div_mapped TEXT;
  divergencias_count INTEGER := 0;
BEGIN
  -- Processar todas as entradas que têm divergências no campo JSON
  FOR entrada_record IN 
    SELECT e.*
    FROM entradas e
    WHERE e.divergencias IS NOT NULL 
    AND jsonb_array_length(e.divergencias) > 0
  LOOP
    -- Processar cada divergência no array JSON
    FOR div_item IN 
      SELECT value FROM jsonb_array_elements(entrada_record.divergencias)
    LOOP
      -- Tentar encontrar o produto pelo nome
      produto_id_found := NULL;
      
      IF div_item->>'produto_nome' IS NOT NULL THEN
        SELECT id INTO produto_id_found
        FROM produtos
        WHERE UPPER(nome) ILIKE UPPER('%' || (div_item->>'produto_nome') || '%')
        LIMIT 1;
      END IF;
      
      -- Mapear tipo de divergência para valores válidos
      tipo_div_mapped := CASE 
        WHEN LOWER(COALESCE(div_item->>'tipo', 'quantidade')) LIKE '%faltante%' OR LOWER(COALESCE(div_item->>'tipo', 'quantidade')) LIKE '%falta%' THEN 'produto_faltante'
        WHEN LOWER(COALESCE(div_item->>'tipo', 'quantidade')) LIKE '%excedente%' OR LOWER(COALESCE(div_item->>'tipo', 'quantidade')) LIKE '%sobra%' THEN 'produto_excedente'
        WHEN LOWER(COALESCE(div_item->>'tipo', 'quantidade')) LIKE '%lote%' THEN 'lote_incorreto'
        WHEN LOWER(COALESCE(div_item->>'tipo', 'quantidade')) LIKE '%validade%' THEN 'validade_incorreta'
        ELSE 'quantidade_incorreta'
      END;
      
      -- Inserir registro na tabela divergencias
      INSERT INTO divergencias (
        user_id,
        deposito_id,
        entrada_id,
        produto_id,
        tipo_origem,
        tipo_divergencia,
        quantidade_esperada,
        quantidade_encontrada,
        lote,
        observacoes,
        status,
        prioridade,
        created_at
      ) VALUES (
        entrada_record.user_id,
        entrada_record.deposito_id,
        entrada_record.id,
        produto_id_found,
        'entrada',
        tipo_div_mapped,
        COALESCE((div_item->>'quantidade_esperada')::numeric, 0),
        COALESCE((div_item->>'quantidade_encontrada')::numeric, 0),
        div_item->>'lote',
        div_item->>'observacoes',
        'pendente',
        COALESCE(div_item->>'prioridade', 'media'),
        entrada_record.created_at
      );
      
      divergencias_count := divergencias_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE LOG 'Migrated % divergencias records', divergencias_count;
  RETURN divergencias_count;
END;
$$;

-- Executar a migração
SELECT migrate_existing_divergencias();