-- Create fazendas table for farm delivery addresses
CREATE TABLE public.fazendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  produtor_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fazendas ENABLE ROW LEVEL SECURITY;

-- Create policies for fazendas
CREATE POLICY "Users can view their own fazendas" 
ON public.fazendas 
FOR SELECT 
USING (auth.uid() = produtor_id);

CREATE POLICY "Users can create their own fazendas" 
ON public.fazendas 
FOR INSERT 
WITH CHECK (auth.uid() = produtor_id);

CREATE POLICY "Users can update their own fazendas" 
ON public.fazendas 
FOR UPDATE 
USING (auth.uid() = produtor_id);

CREATE POLICY "Users can delete their own fazendas" 
ON public.fazendas 
FOR DELETE 
USING (auth.uid() = produtor_id);

-- Franqueados can view fazendas of their producers
CREATE POLICY "Franqueados can view their producers fazendas" 
ON public.fazendas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_hierarchy uh
    JOIN public.profiles p ON p.user_id = uh.parent_user_id
    WHERE uh.child_user_id = fazendas.produtor_id 
      AND uh.parent_user_id = auth.uid()
      AND p.role = 'franqueado'
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_fazendas_updated_at
BEFORE UPDATE ON public.fazendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some default fazendas for existing producers (optional)
INSERT INTO public.fazendas (nome, endereco, cidade, estado, cep, produtor_id)
SELECT 
  'Fazenda Principal',
  'Endereço da propriedade principal',
  'Cidade',
  'Estado',
  '00000-000',
  p.user_id
FROM public.produtores p
WHERE p.ativo = true
ON CONFLICT DO NOTHING;