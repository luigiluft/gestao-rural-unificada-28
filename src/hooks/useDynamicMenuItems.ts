import { useMemo } from "react"
import { usePagePermissions } from "./usePagePermissions"
import { useUserPagePermissions } from "./useUserPagePermissions"
import { useUserHierarchy } from "./useUserHierarchy"
import { 
  LayoutDashboard, 
  Package, 
  TruckIcon, 
  Archive, 
  Send, 
  MapPin, 
  FileText, 
  Users, 
  Building2, 
  UserCheck, 
  ClipboardCheck, 
  Truck, 
  UserPlus, 
  Tractor, 
  UserCog, 
  HelpCircle, 
  User, 
  Settings,
  Shield,
  Waves,
  Grid3X3,
  Clipboard,
  Package2
} from "lucide-react"

export interface MenuItem {
  path: string
  label: string
  icon: any
  badge?: string
  subItems?: MenuItem[]
}

const iconMap = {
  dashboard: LayoutDashboard,
  catalogo: Package,
  entradas: TruckIcon,
  estoque: Archive,
  saidas: Send,
  rastreio: MapPin,
  relatorios: FileText,
  usuarios: Users,
  franquias: Building2,
  franqueados: UserCheck,
  recebimento: ClipboardCheck,
  expedicao: Send,
  produtores: UserPlus,
  fazendas: Tractor,
  subcontas: UserCog,
  suporte: HelpCircle,
  perfil: User,
  configuracoes: Settings,
  "controle-acesso": Shield,
  "alocacao-pallets": Waves,
  "gerenciar-alocacoes": Grid3X3,
  "gerenciar-posicoes": Grid3X3,
  separacao: Clipboard,
  inventario: Package2,
  transporte: Truck,
  "perfis-funcionarios": Users
}

const menuLabels = {
  dashboard: "Dashboard",
  catalogo: "Catálogo",
  entradas: "Entradas",
  estoque: "Estoque",
  saidas: "Saídas",
  rastreio: "Rastreio",
  relatorios: "Relatórios",
  usuarios: "Usuários",
  franquias: "Franquias",
  franqueados: "Franqueados",
  recebimento: "Recebimento",
  expedicao: "Expedição",
  produtores: "Produtores",
  fazendas: "Fazendas",
  subcontas: "Subcontas",
  suporte: "Suporte",
  perfil: "Perfil",
  configuracoes: "Configurações",
  "controle-acesso": "Controle de Acesso",
  "alocacao-pallets": "Alocações",
  "gerenciar-alocacoes": "Gerenciar Alocações",
  "gerenciar-posicoes": "Posições",
  separacao: "Separação",
  inventario: "Inventário",
  transporte: "Transporte",
  "perfis-funcionarios": "Perfis de Funcionários"
}

export const useDynamicMenuItems = () => {
  const { data: permissions = [], isLoading: isLoadingPagePerms } = usePagePermissions()
  const { data: userPermissions = [], isLoading: isLoadingUserPerms } = useUserPagePermissions()
  const { data: hierarchyData, isLoading: isLoadingHierarchy } = useUserHierarchy()

  const menuItems = useMemo(() => {
    if (isLoadingPagePerms || isLoadingUserPerms || isLoadingHierarchy || !permissions?.length) return []

    const visiblePages = permissions
      ?.filter(p => p?.visible_in_menu)
      ?.map(p => p?.page_key)
      .filter(Boolean) || []

    const items: MenuItem[] = []
    
    // Determinar se é master ANTES do loop
    const isMaster = hierarchyData?.isMaster ?? false

    // Ordem específica definida pelo usuário
    const orderedPages = [
      'dashboard',
      'catalogo', 
      'entradas',
      'recebimento',
      'alocacao-pallets',
      'gerenciar-alocacoes',
      'estoque',
      'inventario',
      'saidas',
      'separacao',
      'expedicao',
      'transporte',
      'rastreio',
      'relatorios',
      'produtores',
      'fazendas',
      'perfil',
      'subcontas',
      'perfis-funcionarios',
      'suporte'
    ]

    // Adicionar itens na ordem especificada
    orderedPages.forEach(page => {
      // Primeira camada: verificar se o role tem acesso à página
      if (!visiblePages.includes(page)) return

      // Segunda camada: verificar se o usuário tem permissão individual para ver a página
      const pageViewPermission = `${page}.view`
      const hasUserPermission = userPermissions?.some(perm => perm === pageViewPermission) || false

      // LÓGICA CORRIGIDA:
      // - Se é master (sem parent): mostrar TODAS as páginas do role, ignorar permissões individuais
      // - Se NÃO é master E tem permissões individuais E não tem essa permissão específica: não mostrar
      // - Se NÃO tem permissões individuais definidas: mostrar (usar apenas role)
      if (!isMaster && userPermissions?.length > 0 && !hasUserPermission) {
        return
      }

      const label = menuLabels[page as keyof typeof menuLabels]
      const icon = iconMap[page as keyof typeof iconMap]
      
      if (label && icon) {
        items.push({
          path: page === 'dashboard' ? '/' : `/${page}`,
          label,
          icon
        })
      }
    })

    return items
  }, [permissions, userPermissions, isLoadingPagePerms, isLoadingUserPerms, hierarchyData, isLoadingHierarchy])

  return { menuItems, isLoading: isLoadingPagePerms || isLoadingUserPerms || isLoadingHierarchy }
}