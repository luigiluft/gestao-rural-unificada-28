-- Drop the existing check constraint
ALTER TABLE public.comprovante_fotos 
DROP CONSTRAINT IF EXISTS comprovante_fotos_tipo_check;

-- Add the updated check constraint with 'comprovante_entrega' included
ALTER TABLE public.comprovante_fotos 
ADD CONSTRAINT comprovante_fotos_tipo_check 
CHECK (tipo IN ('produto', 'local', 'assinatura', 'outro', 'comprovante_entrega'));