
export type UserRole = 'admin' | 'franqueado' | 'produtor';

// All possible permissions for pages and actions
export type PermissionCode = 
  | 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage' 
  | 'dashboard.view' | 'entradas.view' | 'saidas.view' | 'recebimento.view' 
  | 'alocacao.view' | 'separacao.view' | 'expedicao.view' | 'inventario.view' 
  | 'relatorios.view' | 'rastreio.view' | 'perfis-funcionarios.view'
  | 'catalogo.view' | 'alocacao-pallets.view' | 'gerenciar-alocacoes.view'
  | 'gerenciar-posicoes.view' | 'fazendas.view' | 'produtores.view'
  | 'perfil.view' | 'subcontas.view' | 'suporte.view' | 'transporte.view';

export interface EmployeeProfile {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  role: UserRole;
  permissions: PermissionCode[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export const PERMISSIONS: Array<{ code: PermissionCode; label: string }> = [
  { code: 'dashboard.view', label: 'Dashboard' },
  { code: 'catalogo.view', label: 'Catálogo' },
  { code: 'entradas.view', label: 'Visualizar Entradas' },
  { code: 'entradas.manage', label: 'Gerenciar entradas' },
  { code: 'recebimento.view', label: 'Central de Recebimento' },
  { code: 'alocacao-pallets.view', label: 'Alocação de Pallets' },
  { code: 'gerenciar-alocacoes.view', label: 'Gerenciar Posições' },
  { code: 'estoque.view', label: 'Ver estoque' },
  { code: 'estoque.manage', label: 'Gerenciar estoque' },
  { code: 'inventario.view', label: 'Inventário' },
  { code: 'saidas.view', label: 'Visualizar Saídas' },
  { code: 'saidas.manage', label: 'Gerenciar saídas' },
  { code: 'separacao.view', label: 'Central de Separação' },
  { code: 'expedicao.view', label: 'Central de Expedição' },
  { code: 'transporte.view', label: 'Transporte' },
  { code: 'rastreio.view', label: 'Rastreamento' },
  { code: 'relatorios.view', label: 'Ver relatórios' },
  { code: 'produtores.view', label: 'Produtores' },
  { code: 'fazendas.view', label: 'Fazendas' },
  { code: 'perfil.view', label: 'Perfil' },
  { code: 'subcontas.view', label: 'Subcontas' },
  { code: 'perfis-funcionarios.view', label: 'Perfis de Funcionários' },
  { code: 'suporte.view', label: 'Suporte' },
];
