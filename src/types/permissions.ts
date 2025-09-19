
export type UserRole = 'admin' | 'franqueado' | 'produtor';

// All possible permissions for pages and actions
export type PermissionCode = 
  | 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage' 
  | 'dashboard.view' | 'entradas.view' | 'saidas.view' | 'recebimento.view' 
  | 'alocacao.view' | 'separacao.view' | 'expedicao.view' | 'inventario.view' 
  | 'relatorios.view' | 'rastreio.view' | 'perfis-funcionarios.view'
  | 'catalogo.view' | 'alocacao-pallets.view' | 'gerenciar-alocacoes.view'
  | 'gerenciar-posicoes.view' | 'fazendas.view' | 'produtores.view'
  | 'perfil.view' | 'subcontas.view' | 'suporte.view' | 'transporte.view'
  | 'remessas.view' | 'planejamento.view' | 'viagens.view' | 'agenda.view'
  | 'tracking.view' | 'proof-of-delivery.view' | 'ocorrencias.view' | 'tabelas-frete.view';

// Template de permissões para criar perfis de funcionários/subcontas
export interface PermissionTemplate {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  target_role: UserRole; // Role alvo para este template
  permissions: PermissionCode[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

// Backward compatibility - será removido após migração completa
export interface EmployeeProfile extends PermissionTemplate {
  role: UserRole; // Alias para target_role
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
  { code: 'remessas.view', label: 'Remessas' },
  { code: 'planejamento.view', label: 'Planejamento' },
  { code: 'viagens.view', label: 'Viagens' },
  { code: 'agenda.view', label: 'Agenda' },
  { code: 'tracking.view', label: 'Tracking' },
  { code: 'proof-of-delivery.view', label: 'Proof of Delivery' },
  { code: 'ocorrencias.view', label: 'Ocorrências' },
  { code: 'tabelas-frete.view', label: 'Tabelas de Frete' },
  { code: 'rastreio.view', label: 'Rastreamento' },
  { code: 'relatorios.view', label: 'Ver relatórios' },
  { code: 'produtores.view', label: 'Produtores' },
  { code: 'fazendas.view', label: 'Fazendas' },
  { code: 'perfil.view', label: 'Perfil' },
  { code: 'subcontas.view', label: 'Subcontas' },
  { code: 'perfis-funcionarios.view', label: 'Perfis de Funcionários' },
  { code: 'suporte.view', label: 'Suporte' },
];
