-- Add viagem_id column to entradas table to link with trips for status synchronization
ALTER TABLE public.entradas 
ADD COLUMN IF NOT EXISTS viagem_id UUID REFERENCES public.viagens(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entradas_viagem_id ON public.entradas(viagem_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.entradas.viagem_id IS 'ID da viagem associada para sincronização de status entre saída e entrada';