-- Add peso_total column to viagens table
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS peso_total NUMERIC DEFAULT 0;

-- Add motorista_id and veiculo_id to viagens table for better integration
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS motorista_id UUID REFERENCES public.motoristas(id);
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS veiculo_id UUID REFERENCES public.veiculos(id);

-- Complete the veiculos table structure
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    placa TEXT NOT NULL UNIQUE,
    modelo TEXT NOT NULL,
    marca TEXT NOT NULL,
    ano INTEGER,
    capacidade_peso NUMERIC,
    capacidade_volume NUMERIC,
    tipo TEXT NOT NULL DEFAULT 'caminhao',
    ativo BOOLEAN NOT NULL DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on veiculos
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- RLS policies for veiculos
CREATE POLICY "Admins can manage all vehicles" ON public.veiculos
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can manage their vehicles" ON public.veiculos
FOR ALL USING (
    auth.uid() = user_id OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND is_ancestor(auth.uid(), user_id))
)
WITH CHECK (
    auth.uid() = user_id OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND is_ancestor(auth.uid(), user_id))
);

-- Enable RLS on motoristas if not already enabled
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

-- RLS policies for motoristas
CREATE POLICY "Admins can manage all drivers" ON public.motoristas
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can manage their drivers" ON public.motoristas
FOR ALL USING (
    auth.uid() = user_id OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND is_ancestor(auth.uid(), user_id))
)
WITH CHECK (
    auth.uid() = user_id OR 
    (has_role(auth.uid(), 'franqueado'::app_role) AND is_ancestor(auth.uid(), user_id))
);

-- Function to calculate total weight of a viagem based on allocated saidas
CREATE OR REPLACE FUNCTION public.calculate_viagem_peso_total(p_viagem_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_peso NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(s.peso_total), 0) INTO total_peso
    FROM public.saidas s
    WHERE s.viagem_id = p_viagem_id;
    
    RETURN total_peso;
END;
$$;