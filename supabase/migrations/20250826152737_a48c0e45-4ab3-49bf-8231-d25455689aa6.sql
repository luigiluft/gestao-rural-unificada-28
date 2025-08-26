-- Criar posições faltantes para a franquia BARUERI-01
-- Layout: 14 ruas × 25 módulos × 6 andares = 2.100 posições
-- Já existem 8 posições, preciso criar mais 2.092

DO $$
DECLARE
    v_deposito_id UUID;
    v_rua INTEGER;
    v_modulo INTEGER;
    v_andar INTEGER;
    v_codigo TEXT;
    v_count INTEGER := 0;
BEGIN
    -- Buscar o ID da franquia BARUERI-01
    SELECT id INTO v_deposito_id 
    FROM public.franquias 
    WHERE nome = 'BARUERI-01';
    
    IF v_deposito_id IS NULL THEN
        RAISE EXCEPTION 'Franquia BARUERI-01 não encontrada';
    END IF;
    
    -- Gerar todas as posições do layout 14x25x6
    FOR v_rua IN 1..14 LOOP
        FOR v_modulo IN 1..25 LOOP
            FOR v_andar IN 1..6 LOOP
                -- Formato do código: R01-M01-A1
                v_codigo := 'R' || LPAD(v_rua::TEXT, 2, '0') || 
                           '-M' || LPAD(v_modulo::TEXT, 2, '0') || 
                           '-A' || v_andar::TEXT;
                
                -- Verificar se a posição já existe
                IF NOT EXISTS (
                    SELECT 1 FROM public.storage_positions 
                    WHERE deposito_id = v_deposito_id AND codigo = v_codigo
                ) THEN
                    -- Inserir a nova posição
                    INSERT INTO public.storage_positions (
                        deposito_id,
                        codigo,
                        descricao,
                        tipo_posicao,
                        capacidade_maxima,
                        ativo,
                        ocupado,
                        reservado_temporariamente
                    ) VALUES (
                        v_deposito_id,
                        v_codigo,
                        'Posição Rua ' || v_rua || ', Módulo ' || v_modulo || ', Andar ' || v_andar,
                        'pallet',
                        1,
                        true,
                        false,
                        false
                    );
                    
                    v_count := v_count + 1;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE LOG 'Criadas % novas posições para a franquia BARUERI-01', v_count;
END $$;