-- Add RLS policy allowing drivers to update their assigned viagens
CREATE POLICY "Drivers can update assigned viagens"
ON public.viagens
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.motoristas m
    WHERE m.id = viagens.motorista_id
      AND m.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.motoristas m
    WHERE m.id = viagens.motorista_id
      AND m.auth_user_id = auth.uid()
  )
);