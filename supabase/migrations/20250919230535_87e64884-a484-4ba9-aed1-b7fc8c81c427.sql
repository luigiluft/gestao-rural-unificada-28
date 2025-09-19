-- Add remessa_id column to saidas table to link saidas to remessas
ALTER TABLE public.saidas 
ADD COLUMN remessa_id UUID REFERENCES public.remessas(id);

-- Add index for better performance
CREATE INDEX idx_saidas_remessa_id ON public.saidas(remessa_id);

-- Add new status for saidas in remessas
-- First check current status values
-- Update the status enum to include 'em_remessa' status