export type UserRole = 'admin' | 'franqueado' | 'produtor';
export type PermissionCode = 
  | 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage' 
  | 'dashboard.view' | 'entradas.view' | 'saidas.view' | 'recebimento.view' 
  | 'alocacao.view' | 'separacao.view' | 'expedicao.view' | 'inventario.view' 
  | 'relatorios.view' | 'rastreio.view' | 'perfis-funcionarios.view' | 'usuarios.manage';

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
  { code: 'estoque.view', label: 'Ver estoque' },
  { code: 'estoque.manage', label: 'Gerenciar estoque' },
  { code: 'entradas.manage', label: 'Gerenciar entradas' },
  { code: 'saidas.manage', label: 'Gerenciar saídas' },
  { code: 'relatorios.view', label: 'Ver relatórios' },
  { code: 'usuarios.manage', label: 'Gerenciar usuários' },
  { code: 'dashboard.view', label: 'Dashboard' },
  { code: 'entradas.view', label: 'Visualizar Entradas' },
  { code: 'saidas.view', label: 'Visualizar Saídas' },
  { code: 'recebimento.view', label: 'Central de Recebimento' },
  { code: 'alocacao.view', label: 'Central de Alocação' },
  { code: 'separacao.view', label: 'Central de Separação' },
  { code: 'expedicao.view', label: 'Central de Expedição' },
  { code: 'inventario.view', label: 'Inventário' },
  { code: 'rastreio.view', label: 'Rastreamento' },
  { code: 'perfis-funcionarios.view', label: 'Perfis de Funcionários' },
];