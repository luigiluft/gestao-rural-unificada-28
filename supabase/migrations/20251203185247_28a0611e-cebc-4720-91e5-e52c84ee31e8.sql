-- Add 'consumidor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consumidor';

-- Update role translations reference
COMMENT ON TYPE public.app_role IS 'User roles: admin, operador, cliente, motorista, consumidor';