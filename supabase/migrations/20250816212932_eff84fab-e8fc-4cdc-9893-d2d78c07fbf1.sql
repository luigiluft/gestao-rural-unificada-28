-- Fix inconsistent data: entries with status 'confirmado' should have status_aprovacao 'confirmado'
UPDATE public.entradas 
SET status_aprovacao = 'confirmado'
WHERE status = 'confirmado' 
  AND status_aprovacao != 'confirmado';