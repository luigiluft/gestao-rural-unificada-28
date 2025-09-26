-- Step 2: Add auth_user_id column to motoristas table and create related tables
ALTER TABLE public.motoristas 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_motoristas_auth_user_id ON public.motoristas(auth_user_id);

-- Create delivery_assignments table to link deliveries to specific drivers
CREATE TABLE public.delivery_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comprovante_id UUID NOT NULL REFERENCES public.comprovantes_entrega(id) ON DELETE CASCADE,
    motorista_id UUID NOT NULL REFERENCES public.motoristas(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'atribuido' CHECK (status IN ('atribuido', 'em_andamento', 'concluido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(comprovante_id, motorista_id)
);

-- Enable RLS on delivery_assignments
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_assignments
CREATE POLICY "Admins can manage all assignments" 
ON public.delivery_assignments FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can manage assignments for their drivers" 
ON public.delivery_assignments FOR ALL 
USING (
    has_role(auth.uid(), 'franqueado'::app_role) AND 
    EXISTS (
        SELECT 1 FROM public.motoristas m 
        WHERE m.id = delivery_assignments.motorista_id 
        AND m.user_id = auth.uid()
    )
)
WITH CHECK (
    has_role(auth.uid(), 'franqueado'::app_role) AND 
    EXISTS (
        SELECT 1 FROM public.motoristas m 
        WHERE m.id = delivery_assignments.motorista_id 
        AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Drivers can view their own assignments" 
ON public.delivery_assignments FOR SELECT 
USING (
    has_role(auth.uid(), 'motorista'::app_role) AND 
    EXISTS (
        SELECT 1 FROM public.motoristas m 
        WHERE m.id = delivery_assignments.motorista_id 
        AND m.auth_user_id = auth.uid()
    )
);

-- Update motoristas RLS policies to support driver role
CREATE POLICY "Drivers can view their own profile" 
ON public.motoristas FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "Drivers can update their own profile" 
ON public.motoristas FOR UPDATE 
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Update comprovantes_entrega RLS policies for drivers
CREATE POLICY "Drivers can view their assigned deliveries" 
ON public.comprovantes_entrega FOR SELECT 
USING (
    has_role(auth.uid(), 'motorista'::app_role) AND 
    EXISTS (
        SELECT 1 FROM public.delivery_assignments da
        JOIN public.motoristas m ON m.id = da.motorista_id
        WHERE da.comprovante_id = comprovantes_entrega.id 
        AND m.auth_user_id = auth.uid()
    )
);

CREATE POLICY "Drivers can update their assigned deliveries" 
ON public.comprovantes_entrega FOR UPDATE 
USING (
    has_role(auth.uid(), 'motorista'::app_role) AND 
    EXISTS (
        SELECT 1 FROM public.delivery_assignments da
        JOIN public.motoristas m ON m.id = da.motorista_id
        WHERE da.comprovante_id = comprovantes_entrega.id 
        AND m.auth_user_id = auth.uid()
    )
)
WITH CHECK (
    has_role(auth.uid(), 'motorista'::app_role) AND 
    EXISTS (
        SELECT 1 FROM public.delivery_assignments da
        JOIN public.motoristas m ON m.id = da.motorista_id
        WHERE da.comprovante_id = comprovantes_entrega.id 
        AND m.auth_user_id = auth.uid()
    )
);

-- Create function to link driver to auth user after invitation acceptance
CREATE OR REPLACE FUNCTION public.link_motorista_to_auth_user(
    p_cpf TEXT,
    p_auth_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update motorista with auth_user_id based on CPF match
    UPDATE public.motoristas 
    SET auth_user_id = p_auth_user_id,
        updated_at = now()
    WHERE cpf = p_cpf 
    AND auth_user_id IS NULL;
    
    RETURN FOUND;
END;
$$;