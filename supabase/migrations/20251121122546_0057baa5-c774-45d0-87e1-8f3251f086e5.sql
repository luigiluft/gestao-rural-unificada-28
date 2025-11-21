-- Criar posições para depósitos com layout mas sem posições (ignorar conflitos)
DO $$
DECLARE
  franquia_record RECORD;
  layout_json JSONB;
  capacidade DECIMAL;
  total_inserted INT := 0;
  total_geral INT := 0;
BEGIN
  FOR franquia_record IN 
    SELECT id, nome, layout_armazem::jsonb as layout
    FROM franquias 
    WHERE ativo = true 
      AND layout_armazem IS NOT NULL 
      AND layout_armazem != ''
      AND NOT EXISTS (
        SELECT 1 FROM storage_positions sp 
        WHERE sp.deposito_id = franquias.id LIMIT 1
      )
  LOOP
    layout_json := franquia_record.layout;
    capacidade := COALESCE((layout_json->>'capacidade_por_posicao')::DECIMAL, 1.2);
    
    -- Gerar posições para esta franquia (ignorar duplicatas)
    INSERT INTO storage_positions (deposito_id, codigo, descricao, capacidade_maxima, ativo, ocupado, reservado_temporariamente)
    SELECT 
      franquia_record.id,
      'R' || LPAD(r.rua::TEXT, 2, '0') || '-M' || LPAD(m.modulo::TEXT, 2, '0') || '-A' || LPAD(a.andar::TEXT, 2, '0') as codigo,
      'Rua ' || r.rua || ', Módulo ' || m.modulo || ', Andar ' || a.andar as descricao,
      capacidade,
      true,
      false,
      false
    FROM 
      generate_series(1, (layout_json->>'ruas')::INT) as r(rua),
      generate_series(1, (layout_json->>'modulos')::INT) as m(modulo),
      generate_series(1, (layout_json->>'andares')::INT) as a(andar)
    ON CONFLICT (deposito_id, codigo) DO NOTHING;
    
    GET DIAGNOSTICS total_inserted = ROW_COUNT;
    total_geral := total_geral + total_inserted;
    RAISE NOTICE 'Criadas % posições para % (Total acumulado: %)', total_inserted, franquia_record.nome, total_geral;
  END LOOP;
  
  RAISE NOTICE '=== CONCLUÍDO: Total de % posições criadas ===', total_geral;
END $$;