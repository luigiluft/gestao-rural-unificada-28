-- Recreate allocate_pallet_to_position function with explicit schema references
CREATE OR REPLACE FUNCTION public.allocate_pallet_to_position(
  p_pallet_id UUID,
  p_posicao_id UUID,
  p_observacoes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_position_occupied BOOLEAN;
BEGIN
  -- Check if position exists and is not occupied using explicit schema
  SELECT ocupado INTO v_position_occupied
  FROM public.storage_positions
  WHERE id = p_posicao_id AND ativo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Posição não encontrada ou inativa';
  END IF;
  
  IF v_position_occupied THEN
    RAISE EXCEPTION 'Posição já está ocupada';
  END IF;
  
  -- Insert pallet position record using explicit schema
  INSERT INTO public.pallet_positions (pallet_id, posicao_id, alocado_por, observacoes)
  VALUES (p_pallet_id, p_posicao_id, auth.uid(), p_observacoes);
  
  -- Mark position as occupied using explicit schema
  UPDATE public.storage_positions
  SET ocupado = true, updated_at = now()
  WHERE id = p_posicao_id;
  
  RETURN TRUE;
END;
$$;

-- Add RLS policies for pallet_positions table for clients
-- First drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "pallet_positions_insert_policy" ON public.pallet_positions;
DROP POLICY IF EXISTS "pallet_positions_update_policy" ON public.pallet_positions;
DROP POLICY IF EXISTS "pallet_positions_delete_policy" ON public.pallet_positions;

-- Create INSERT policy for clients
CREATE POLICY "pallet_positions_insert_policy" ON public.pallet_positions
FOR INSERT
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.ativo = true
  )
  OR EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.ativo = true
  )
);

-- Create UPDATE policy for clients
CREATE POLICY "pallet_positions_update_policy" ON public.pallet_positions
FOR UPDATE
USING (
  public.check_user_role_safe(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.ativo = true
  )
  OR EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.ativo = true
  )
)
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.ativo = true
  )
  OR EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.ativo = true
  )
);

-- Create DELETE policy for clients
CREATE POLICY "pallet_positions_delete_policy" ON public.pallet_positions
FOR DELETE
USING (
  public.check_user_role_safe(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.franquia_usuarios fu
    WHERE fu.user_id = auth.uid() AND fu.ativo = true
  )
  OR EXISTS (
    SELECT 1 FROM public.cliente_usuarios cu
    WHERE cu.user_id = auth.uid() AND cu.ativo = true
  )
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';