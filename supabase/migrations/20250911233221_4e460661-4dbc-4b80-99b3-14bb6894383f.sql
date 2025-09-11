-- Adicionar campos para sistema de etiquetas de pallets
ALTER TABLE public.entrada_pallets 
ADD COLUMN codigo_barras TEXT UNIQUE,
ADD COLUMN quantidade_atual NUMERIC DEFAULT 0;

-- Função para gerar código de barras único para pallets
CREATE OR REPLACE FUNCTION public.generate_pallet_barcode()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Trigger para gerar código automaticamente ao criar pallet
CREATE OR REPLACE FUNCTION public.trigger_generate_pallet_barcode()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_pallet_barcode_generation ON public.entrada_pallets;
CREATE TRIGGER trigger_pallet_barcode_generation
    BEFORE INSERT OR UPDATE ON public.entrada_pallets
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_pallet_barcode();

-- Gerar códigos para pallets existentes
UPDATE public.entrada_pallets 
SET codigo_barras = public.generate_pallet_barcode()
WHERE codigo_barras IS NULL;

-- Atualizar quantidades atuais para pallets existentes
UPDATE public.entrada_pallets ep
SET quantidade_atual = (
    SELECT COALESCE(SUM(epi.quantidade), 0)
    FROM public.entrada_pallet_itens epi
    WHERE epi.pallet_id = ep.id
)
WHERE quantidade_atual IS NULL OR quantidade_atual = 0;