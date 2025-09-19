-- Create viagem_remessas relationship table
CREATE TABLE public.viagem_remessas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    viagem_id UUID NOT NULL,
    remessa_id UUID NOT NULL,
    ordem_entrega INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(viagem_id, remessa_id)
);

-- Enable RLS
ALTER TABLE public.viagem_remessas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage viagem_remessas for their data" ON public.viagem_remessas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.viagens v 
    WHERE v.id = viagem_remessas.viagem_id 
    AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ) OR 
  EXISTS (
    SELECT 1 FROM public.remessas r 
    WHERE r.id = viagem_remessas.remessa_id 
    AND (r.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.viagens v 
    WHERE v.id = viagem_remessas.viagem_id 
    AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ) OR 
  EXISTS (
    SELECT 1 FROM public.remessas r 
    WHERE r.id = viagem_remessas.remessa_id 
    AND (r.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Franqueados can view viagem_remessas in their franchise" ON public.viagem_remessas
FOR SELECT USING (
  has_role(auth.uid(), 'franqueado') AND (
    EXISTS (
      SELECT 1 FROM public.viagens v 
      WHERE v.id = viagem_remessas.viagem_id 
      AND v.user_id IN (
        SELECT uh.child_user_id 
        FROM user_hierarchy uh 
        WHERE uh.parent_user_id = auth.uid()
      )
    ) OR 
    EXISTS (
      SELECT 1 FROM public.remessas r 
      WHERE r.id = viagem_remessas.remessa_id 
      AND r.user_id IN (
        SELECT uh.child_user_id 
        FROM user_hierarchy uh 
        WHERE uh.parent_user_id = auth.uid()
      )
    )
  )
);