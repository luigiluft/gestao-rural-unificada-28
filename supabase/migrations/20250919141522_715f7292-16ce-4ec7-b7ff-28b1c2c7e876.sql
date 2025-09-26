-- Atualizar o template "Administrador" para incluir todas as permissões de franqueado
UPDATE public.permission_templates
SET permissions = ARRAY[
  'dashboard.view',
  'catalogo.view', 
  'entradas.view',
  'entradas.manage',
  'recebimento.view',
  'alocacao-pallets.view',
  'gerenciar-posicoes.view',
  'estoque.view',
  'estoque.manage',
  'inventario.view',
  'saidas.view',
  'saidas.manage',
  'separacao.view',
  'transporte.view',
  'rastreio.view',
  'relatorios.view',
  'produtores.view',
  'fazendas.view',
  'perfil.view',
  'subcontas.view',
  'perfis-funcionarios.view',
  'suporte.view'
]::permission_code[],
updated_at = now()
WHERE nome = 'Administrador' AND target_role = 'franqueado';