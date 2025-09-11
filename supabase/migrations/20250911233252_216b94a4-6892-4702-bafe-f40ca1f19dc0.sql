-- Corrigir search_path para as funções criadas recentemente
CREATE OR REPLACE FUNCTION public.generate_pallet_barcode()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    new_barcode TEXT;
    barcode_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar código de 12 dígitos: PLT + 8 dígitos aleatórios + verificador
        new_barcode := 'PLT' || LPAD(floor(random() * 100000000)::TEXT, 8, '0');
        
        -- Verificar se já existe
        SELECT EXISTS (
            SELECT 1 FROM public.entrada_pallets 
            WHERE codigo_barras = new_barcode
        ) INTO barcode_exists;
        
        -- Se não existe, sair do loop
        IF NOT barcode_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_barcode;
END;
$$;

-- Corrigir search_path para trigger function
CREATE OR REPLACE FUNCTION public.trigger_generate_pallet_barcode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.codigo_barras IS NULL THEN
        NEW.codigo_barras := public.generate_pallet_barcode();
    END IF;
    
    -- Definir quantidade_atual igual à soma dos itens do pallet
    IF NEW.quantidade_atual IS NULL OR NEW.quantidade_atual = 0 THEN
        SELECT COALESCE(SUM(epi.quantidade), 0) INTO NEW.quantidade_atual
        FROM public.entrada_pallet_itens epi
        WHERE epi.pallet_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;