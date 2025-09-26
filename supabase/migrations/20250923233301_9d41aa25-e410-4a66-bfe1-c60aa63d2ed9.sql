-- Add coordinate fields to franquias table
ALTER TABLE public.franquias 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;

-- Update coordinates for lucca+2@luft.com.br franchise
UPDATE public.franquias 
SET latitude = 38.736946, longitude = -9.142685 
WHERE id IN (
  SELECT f.id 
  FROM franquias f 
  JOIN profiles p ON p.user_id = f.master_franqueado_id 
  WHERE p.email = 'lucca+2@luft.com.br'
);