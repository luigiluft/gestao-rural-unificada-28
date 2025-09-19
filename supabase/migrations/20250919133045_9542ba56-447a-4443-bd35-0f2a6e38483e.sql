-- Update expedition profile to include dashboard, catalog, stock, inventory, exits, and expedition
UPDATE permission_templates 
SET permissions = ARRAY[
  'dashboard.view',
  'catalogo.view', 
  'estoque.view',
  'inventario.view',
  'saidas.view',
  'expedicao.view'
]::permission_code[]
WHERE nome = 'Expedição' AND target_role = 'franqueado';

-- Update allocation profile to include the manage positions page
UPDATE permission_templates 
SET permissions = ARRAY[
  'dashboard.view',
  'catalogo.view', 
  'entradas.view',
  'alocacao-pallets.view',
  'estoque.view',
  'inventario.view',
  'gerenciar-posicoes.view'
]::permission_code[]
WHERE nome = 'Alocação' AND target_role = 'franqueado';