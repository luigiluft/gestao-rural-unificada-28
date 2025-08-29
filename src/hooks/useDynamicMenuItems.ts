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
    if (isLoadingPagePerms || isLoadingUserPerms || isLoadingHierarchy || !permissions.length) return []

    const visiblePages = permissions
      .filter(p => p.visible_in_menu)
      .map(p => p.page_key)

    const items: MenuItem[] = []

    // Ordem específica definida pelo usuário
    const orderedPages = [
      'dashboard',
      'catalogo', 
      'entradas',
      'recebimento',
      'alocacao-pallets',
      'estoque',
      'inventario',
      'saidas',
      'separacao',
      'expedicao',
      'transporte',
      'rastreio',
      'relatorios',
      'usuarios',
      'franquias',
      'franqueados',
      'produtores',
      'perfil',
      'subcontas',
      'perfis-funcionarios',
      'controle-acesso',
      'configuracoes',
      'suporte'
    ]

    // Adicionar itens na ordem especificada
    orderedPages.forEach(page => {
      // Primeira camada: verificar se o role tem acesso à página
      if (!visiblePages.includes(page)) return

      // Segunda camada: verificar se o usuário tem permissão individual para ver a página
      const pageViewPermission = `${page}.view`
      const hasUserPermission = userPermissions.some(perm => perm === pageViewPermission)

      // Para franqueados master (sem parent na hierarquia), usar sempre as permissões do role
      // Para subcontas, usar o sistema de permissões individuais
      const isMaster = hierarchyData?.isMaster ?? false
      
      // Se tem permissões individuais definidas mas não tem essa específica, não mostrar
      // EXCETO se for um franqueado master (que deve ter acesso completo do role)
      if (userPermissions.length > 0 && !hasUserPermission && !isMaster) return

      items.push({
        path: page === 'dashboard' ? '/' : `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      })
    })

    return items
  }, [permissions, userPermissions, isLoadingPagePerms, isLoadingUserPerms, hierarchyData, isLoadingHierarchy])

  return { menuItems, isLoading: isLoadingPagePerms || isLoadingUserPerms || isLoadingHierarchy }
}