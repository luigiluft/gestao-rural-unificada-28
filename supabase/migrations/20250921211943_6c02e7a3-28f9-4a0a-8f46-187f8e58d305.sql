-- Add viagem_id column to saidas table for trip allocation
ALTER TABLE public.saidas ADD COLUMN viagem_id UUID REFERENCES public.viagens(id);