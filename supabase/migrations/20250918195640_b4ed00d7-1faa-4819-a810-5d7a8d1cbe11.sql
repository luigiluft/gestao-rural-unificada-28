-- Adicionar campo de expiração para convites
ALTER TABLE public.pending_invites 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days');

-- Atualizar convites existentes para não expirarem por enquanto
UPDATE public.pending_invites 
SET expires_at = now() + INTERVAL '7 days'
WHERE expires_at IS NULL;