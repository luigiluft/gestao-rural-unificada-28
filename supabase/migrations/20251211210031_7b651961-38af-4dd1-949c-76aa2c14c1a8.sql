-- Fix the generate_inventory_number function with correct search_path
CREATE OR REPLACE FUNCTION public.generate_inventory_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    next_num INTEGER;
    inv_number TEXT;
BEGIN
    -- Get next number for today
    SELECT COALESCE(MAX(
        CASE 
            WHEN numero_inventario ~ '^INV-[0-9]{8}-[0-9]+$' 
            THEN (regexp_match(numero_inventario, '^INV-[0-9]{8}-([0-9]+)$'))[1]::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM public.inventarios
    WHERE DATE(created_at) = CURRENT_DATE;
    
    inv_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_num::TEXT, 3, '0');
    
    RETURN inv_number;
END;
$function$;