-- Add deposit-related fields to franquias table
ALTER TABLE public.franquias 
ADD COLUMN IF NOT EXISTS capacidade_total numeric,
ADD COLUMN IF NOT EXISTS descricao_deposito text;

-- Migrate existing depositos data to franquias
-- First, create franquias for existing depositos that don't have a franquia yet
INSERT INTO public.franquias (
  nome, 
  master_franqueado_id, 
  capacidade_total, 
  descricao_deposito,
  endereco,
  cidade,
  estado,
  cep,
  telefone,
  email,
  ativo
)
SELECT 
  d.nome || ' - Franquia',
  d.user_id,
  d.capacidade_total,
  d.descricao,
  d.endereco,
  p.cidade,
  p.estado,
  p.cep,
  p.telefone,
  p.email,
  d.ativo
FROM public.depositos d
JOIN public.profiles p ON p.user_id = d.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.franquias f 
  WHERE f.master_franqueado_id = d.user_id
);