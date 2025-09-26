-- Enable RLS and add policies for TMS tables

-- Enable RLS on all TMS tables
ALTER TABLE public.remessas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovantes_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovante_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabelas_frete ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for remessas table
CREATE POLICY "Users can manage their own remessas" ON public.remessas
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all remessas" ON public.remessas
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Franqueados can view remessas in their franchise" ON public.remessas
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado') AND 
  user_id IN (
    SELECT uh.child_user_id 
    FROM user_hierarchy uh 
    WHERE uh.parent_user_id = auth.uid()
  )
);

-- Create RLS policies for viagens table
CREATE POLICY "Users can manage their own viagens" ON public.viagens
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all viagens" ON public.viagens
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Franqueados can view viagens in their franchise" ON public.viagens
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado') AND 
  user_id IN (
    SELECT uh.child_user_id 
    FROM user_hierarchy uh 
    WHERE uh.parent_user_id = auth.uid()
  )
);

-- Create RLS policies for agendamentos table  
CREATE POLICY "Users can manage their own agendamentos" ON public.agendamentos
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all agendamentos" ON public.agendamentos
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Franqueados can view agendamentos in their franchise" ON public.agendamentos
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado') AND 
  user_id IN (
    SELECT uh.child_user_id 
    FROM user_hierarchy uh 
    WHERE uh.parent_user_id = auth.uid()
  )
);

-- Create RLS policies for ocorrencias table
CREATE POLICY "Users can manage their own ocorrencias" ON public.ocorrencias  
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all ocorrencias" ON public.ocorrencias
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Franqueados can view ocorrencias in their franchise" ON public.ocorrencias
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado') AND 
  user_id IN (
    SELECT uh.child_user_id 
    FROM user_hierarchy uh 
    WHERE uh.parent_user_id = auth.uid()
  )
);

-- Create basic policies for other TMS tables (public read for authenticated users)
CREATE POLICY "Authenticated users can read transportadoras" ON public.transportadoras
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage transportadoras" ON public.transportadoras
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read tabelas_frete" ON public.tabelas_frete
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tabelas_frete" ON public.tabelas_frete
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read motoristas" ON public.motoristas
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage motoristas" ON public.motoristas
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read veiculos" ON public.veiculos
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage veiculos" ON public.veiculos
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));