-- Primeiro: expandir enum permission_code para incluir permissões de visibilidade de páginas
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'dashboard.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'entradas.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'saidas.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'estoque.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'recebimento.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'alocacao.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'separacao.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'expedicao.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'inventario.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'relatorios.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'rastreio.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'perfis-funcionarios.view';