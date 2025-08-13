-- Add invite_token column to pending_invites table
ALTER TABLE public.pending_invites 
ADD COLUMN invite_token text UNIQUE DEFAULT gen_random_uuid()::text;