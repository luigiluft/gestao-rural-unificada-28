-- Update the allocation employee profile to include dashboard, catalog, entries, allocations, stock and inventory permissions
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