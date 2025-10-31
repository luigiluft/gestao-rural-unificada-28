-- Habilitar RLS na tabela contratos_servico
ALTER TABLE public.contratos_servico ENABLE ROW LEVEL SECURITY;

-- Política para Admins: podem ver e gerenciar todos os contratos
CREATE POLICY "Admins têm acesso total aos contratos"
ON public.contratos_servico
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para Franqueados: podem ver e gerenciar apenas contratos da sua franquia
CREATE POLICY "Franqueados podem ver contratos da sua franquia"
ON public.contratos_servico
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.franquias ON franquias.master_franqueado_id = profiles.user_id
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'franqueado'
    AND franquias.id = contratos_servico.franquia_id
  )
);

-- Política para Franqueados: podem criar contratos para sua franquia
CREATE POLICY "Franqueados podem criar contratos para sua franquia"
ON public.contratos_servico
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.franquias ON franquias.master_franqueado_id = profiles.user_id
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'franqueado'
    AND franquias.id = contratos_servico.franquia_id
  )
);

-- Política para Franqueados: podem atualizar contratos da sua franquia
CREATE POLICY "Franqueados podem atualizar contratos da sua franquia"
ON public.contratos_servico
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.franquias ON franquias.master_franqueado_id = profiles.user_id
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'franqueado'
    AND franquias.id = contratos_servico.franquia_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.franquias ON franquias.master_franqueado_id = profiles.user_id
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'franqueado'
    AND franquias.id = contratos_servico.franquia_id
  )
);

-- Política para Franqueados: podem deletar contratos da sua franquia
CREATE POLICY "Franqueados podem deletar contratos da sua franquia"
ON public.contratos_servico
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.franquias ON franquias.master_franqueado_id = profiles.user_id
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'franqueado'
    AND franquias.id = contratos_servico.franquia_id
  )
);