-- Primeiro remover a constraint atual
ALTER TABLE divergencias DROP CONSTRAINT IF EXISTS divergencias_tipo_divergencia_check;

-- Criar nova constraint incluindo 'avaria'
ALTER TABLE divergencias ADD CONSTRAINT divergencias_tipo_divergencia_check 
CHECK (tipo_divergencia = ANY (ARRAY[
  'produto_faltante'::text, 
  'produto_excedente'::text, 
  'pallet_faltante'::text, 
  'pallet_excedente'::text, 
  'quantidade_incorreta'::text, 
  'posicao_vazia'::text, 
  'posicao_ocupada_incorreta'::text, 
  'validade_incorreta'::text, 
  'lote_incorreto'::text,
  'avaria'::text
]));

-- Agora corrigir o registro específico
UPDATE divergencias 
SET tipo_divergencia = 'avaria',
    updated_at = now()
WHERE id = '7dfba67d-ac68-41c9-b299-92fc550be0c2' 
  AND tipo_divergencia = 'produto_faltante';