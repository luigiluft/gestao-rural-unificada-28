-- Step A: Create enum and fix status issues (REVISED)

-- 1. Create enum for comprovante status
CREATE TYPE public.comprovante_status AS ENUM ('pendente', 'em_andamento', 'entregue', 'cancelado');

-- 2. Data fix: Update any 'confirmado' status to 'entregue'
UPDATE public.comprovantes_entrega 
SET status = 'entregue' 
WHERE status = 'confirmado';

-- 3. Drop old check constraint if exists
ALTER TABLE public.comprovantes_entrega 
DROP CONSTRAINT IF EXISTS comprovantes_entrega_status_check;

-- 4. Remove default first
ALTER TABLE public.comprovantes_entrega 
ALTER COLUMN status DROP DEFAULT;

-- 5. Alter column to use enum
ALTER TABLE public.comprovantes_entrega 
ALTER COLUMN status TYPE public.comprovante_status 
USING status::public.comprovante_status;

-- 6. Set new default value with proper type
ALTER TABLE public.comprovantes_entrega 
ALTER COLUMN status SET DEFAULT 'pendente'::public.comprovante_status;

-- 7. Create atomic increment function for total_fotos
CREATE OR REPLACE FUNCTION public.increment_total_fotos(p_comprovante_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total integer;
BEGIN
  UPDATE public.comprovantes_entrega
  SET 
    total_fotos = total_fotos + 1,
    updated_at = now()
  WHERE id = p_comprovante_id
  RETURNING total_fotos INTO v_new_total;
  
  RETURN v_new_total;
END;
$$;