-- RLS policies fix for comprovantes_entrega and comprovante_fotos
BEGIN;

-- Ensure RLS on comprovantes_entrega
ALTER TABLE public.comprovantes_entrega ENABLE ROW LEVEL SECURITY;

-- Drop possibly conflicting policies
DROP POLICY IF EXISTS "Admins can manage all comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can insert own comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can select own comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Users can update own comprovantes_entrega" ON public.comprovantes_entrega;
DROP POLICY IF EXISTS "Drivers can select/update comprovantes for assigned deliveries" ON public.comprovantes_entrega;

-- Admins manage all
CREATE POLICY "Admins can manage all comprovantes_entrega"
ON public.comprovantes_entrega
FOR ALL
USING (public.check_user_role_safe(auth.uid(), 'admin'::app_role))
WITH CHECK (public.check_user_role_safe(auth.uid(), 'admin'::app_role));

-- Owners can insert/select/update their own comprovantes
CREATE POLICY "Users can insert own comprovantes_entrega"
ON public.comprovantes_entrega
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can select own comprovantes_entrega"
ON public.comprovantes_entrega
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own comprovantes_entrega"
ON public.comprovantes_entrega
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Drivers assigned to the delivery can view/update
CREATE POLICY "Drivers can select comprovantes for assigned deliveries"
ON public.comprovantes_entrega
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    JOIN public.motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovantes_entrega.id
    AND m.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update comprovantes for assigned deliveries"
ON public.comprovantes_entrega
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    JOIN public.motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovantes_entrega.id
    AND m.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    JOIN public.motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovantes_entrega.id
    AND m.auth_user_id = auth.uid()
  )
);

-- Ensure RLS and correct policies on comprovante_fotos
ALTER TABLE public.comprovante_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all comprovante_fotos" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Users can insert photos for their comprovantes" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Users can view photos of their comprovantes" ON public.comprovante_fotos;
DROP POLICY IF EXISTS "Drivers can manage photos for assigned deliveries" ON public.comprovante_fotos;

CREATE POLICY "Admins can manage all comprovante_fotos"
ON public.comprovante_fotos
FOR ALL
USING (public.check_user_role_safe(auth.uid(), 'admin'::app_role))
WITH CHECK (public.check_user_role_safe(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert photos for their comprovantes"
ON public.comprovante_fotos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comprovantes_entrega ce 
    WHERE ce.id = comprovante_fotos.comprovante_id 
    AND ce.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view photos of their comprovantes"
ON public.comprovante_fotos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.comprovantes_entrega ce 
    WHERE ce.id = comprovante_fotos.comprovante_id 
    AND ce.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can manage photos for assigned deliveries"
ON public.comprovante_fotos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    JOIN public.motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovante_fotos.comprovante_id 
    AND m.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    JOIN public.motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovante_fotos.comprovante_id 
    AND m.auth_user_id = auth.uid()
  )
);

COMMIT;