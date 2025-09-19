-- Update receiving profile to have the same pages as allocation but with receiving instead of allocation
UPDATE permission_templates 
SET permissions = ARRAY[
  'dashboard.view',
  'catalogo.view', 
  'entradas.view',
  'recebimento.view',
  'estoque.view',
  'inventario.view',
  'gerenciar-posicoes.view'
]::permission_code[]
WHERE nome = 'Recebimento' AND target_role = 'franqueado';