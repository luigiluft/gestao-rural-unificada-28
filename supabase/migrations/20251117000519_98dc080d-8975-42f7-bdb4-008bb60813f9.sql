-- Remove address fields from profiles table as they are now in clientes
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS endereco,
  DROP COLUMN IF EXISTS cidade,
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS cep;