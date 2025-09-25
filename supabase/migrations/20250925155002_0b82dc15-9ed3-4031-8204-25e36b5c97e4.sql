-- Ensure RLS and policies for motoristas and viagens to allow drivers to see their data

-- Motoristas: drivers should be able to view their own record; franqueados/admins manage their drivers
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

-- Check if policy exists and create if not
DROP POLICY IF EXISTS "Drivers can view their own motorista" ON public.motoristas;
CREATE POLICY "Drivers can view their own motorista"
ON public.motoristas
FOR SELECT
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Franqueados can manage their motoristas" ON public.motoristas;
CREATE POLICY "Franqueados can manage their motoristas"
ON public.motoristas
FOR ALL
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Viagens: drivers should be able to view trips assigned to them via motorista_id
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view assigned viagens" ON public.viagens;
CREATE POLICY "Drivers can view assigned viagens"
ON public.viagens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.motoristas m
    WHERE m.id = viagens.motorista_id
      AND m.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Franqueados can manage own viagens" ON public.viagens;
CREATE POLICY "Franqueados can manage own viagens"
ON public.viagens
FOR ALL
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));