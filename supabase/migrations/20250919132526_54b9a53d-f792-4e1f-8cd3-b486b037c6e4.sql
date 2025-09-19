-- First, add missing permission codes to the enum
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'catalogo.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'alocacao-pallets.view';

-- Update the allocation employee profile to include the required permissions
UPDATE permission_templates 
SET permissions = ARRAY[
  'dashboard.view',
  'catalogo.view', 
  'entradas.view',
  'alocacao-pallets.view',
  'estoque.view',
  'inventario.view'
]::permission_code[]
WHERE nome = 'Alocação' AND target_role = 'franqueado';