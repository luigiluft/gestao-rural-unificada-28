-- Add phone field to saidas table
ALTER TABLE public.saidas 
ADD COLUMN telefone_motorista TEXT;

-- Create table for time slot reservations
CREATE TABLE public.reservas_horario (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    data_saida DATE NOT NULL,
    horario TEXT NOT NULL,
    saida_id UUID REFERENCES public.saidas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    deposito_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservas_horario ENABLE ROW LEVEL SECURITY;

-- Create policies for reservas_horario
CREATE POLICY "Users can view reservations for their deposits" 
ON public.reservas_horario 
FOR SELECT 
USING (
    user_id = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (
        has_role(auth.uid(), 'franqueado'::app_role) 
        AND deposito_id IN (
            SELECT id FROM public.franquias 
            WHERE master_franqueado_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create reservations" 
ON public.reservas_horario 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservas_horario 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations" 
ON public.reservas_horario 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent double bookings
CREATE UNIQUE INDEX idx_reservas_horario_unique 
ON public.reservas_horario (data_saida, horario, deposito_id);

-- Create indexes for performance
CREATE INDEX idx_reservas_horario_data_deposito 
ON public.reservas_horario (data_saida, deposito_id);

-- Add trigger for updated_at
CREATE TRIGGER update_reservas_horario_updated_at
    BEFORE UPDATE ON public.reservas_horario
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();