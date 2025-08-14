-- Create franquias table
CREATE TABLE public.franquias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  master_franqueado_id UUID NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on franquias
ALTER TABLE public.franquias ENABLE ROW LEVEL SECURITY;

-- Add franquia_id to produtores table
ALTER TABLE public.produtores ADD COLUMN franquia_id UUID REFERENCES public.franquias(id);

-- Create RLS policies for franquias
CREATE POLICY "Admins can manage all franquias" 
ON public.franquias 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can view their own franquia" 
ON public.franquias 
FOR SELECT 
USING (
  auth.uid() = master_franqueado_id OR 
  EXISTS (
    SELECT 1 FROM public.user_hierarchy uh 
    WHERE uh.child_user_id = auth.uid() 
    AND uh.parent_user_id = master_franqueado_id
  )
);

CREATE POLICY "Master franqueados can update their franquia" 
ON public.franquias 
FOR UPDATE 
USING (auth.uid() = master_franqueado_id)
WITH CHECK (auth.uid() = master_franqueado_id);

-- Update produtores RLS policies to work with franquias
DROP POLICY IF EXISTS "Franqueados manage descendant produtores" ON public.produtores;
CREATE POLICY "Franqueados manage produtores from same franquia" 
ON public.produtores 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.franquias f 
    WHERE f.id = produtores.franquia_id 
    AND (
      f.master_franqueado_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.user_hierarchy uh 
        WHERE uh.child_user_id = auth.uid() 
        AND uh.parent_user_id = f.master_franqueado_id
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.franquias f 
    WHERE f.id = produtores.franquia_id 
    AND (
      f.master_franqueado_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.user_hierarchy uh 
        WHERE uh.child_user_id = auth.uid() 
        AND uh.parent_user_id = f.master_franqueado_id
      )
    )
  )
);

-- Add trigger for updated_at on franquias
CREATE TRIGGER update_franquias_updated_at
BEFORE UPDATE ON public.franquias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user's franquia
CREATE OR REPLACE FUNCTION public.get_user_franquia(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') 
    THEN NULL -- Admins don't belong to specific franquia
    WHEN EXISTS (SELECT 1 FROM public.franquias WHERE master_franqueado_id = _user_id)
    THEN (SELECT id FROM public.franquias WHERE master_franqueado_id = _user_id LIMIT 1)
    ELSE (
      SELECT f.id 
      FROM public.franquias f
      JOIN public.user_hierarchy uh ON uh.parent_user_id = f.master_franqueado_id
      WHERE uh.child_user_id = _user_id
      LIMIT 1
    )
  END;
$$;