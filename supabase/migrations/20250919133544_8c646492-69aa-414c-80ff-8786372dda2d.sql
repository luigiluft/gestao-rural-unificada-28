-- Update separation profile to have the same pages as expedition but with separation instead of expedition
UPDATE permission_templates 
SET permissions = ARRAY[
  'dashboard.view',
  'catalogo.view', 
  'estoque.view',
  'inventario.view',
  'saidas.view',
  'separacao.view'
]::permission_code[]
WHERE nome = 'Separação' AND target_role = 'franqueado';