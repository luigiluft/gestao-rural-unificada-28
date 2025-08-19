import { useMemo } from "react"
import { usePagePermissions } from "./usePagePermissions"
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
  Grid3X3
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
  expedicao: Truck,
  produtores: UserPlus,
  fazendas: Tractor,
  subcontas: UserCog,
  suporte: HelpCircle,
  perfil: User,
  configuracoes: Settings,
  "controle-acesso": Shield,
  "ondas-alocacao": Waves,
  "gerenciar-posicoes": Grid3X3
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
  "ondas-alocacao": "Alocações",
  "gerenciar-posicoes": "Posições"
}

export const useDynamicMenuItems = () => {
  const { data: permissions = [], isLoading } = usePagePermissions()

  const menuItems = useMemo(() => {
    if (isLoading || !permissions.length) return []

    const visiblePages = permissions
      .filter(p => p.visible_in_menu)
      .map(p => p.page_key)

    const items: MenuItem[] = []

    // Grupo Principal
    const mainItems = ['dashboard', 'catalogo', 'entradas', 'estoque', 'saidas', 'rastreio', 'relatorios']
      .filter(page => visiblePages.includes(page))
      .map(page => ({
        path: page === 'dashboard' ? '/' : `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      }))

    if (mainItems.length > 0) {
      items.push(...mainItems)
    }

    // Administração
    const adminItems = ['usuarios', 'franquias', 'franqueados']
      .filter(page => visiblePages.includes(page))
      .map(page => ({
        path: `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      }))

    if (adminItems.length > 0) {
      items.push(...adminItems)
    }

    // Operações
    const operationItems = ['recebimento', 'expedicao', 'ondas-alocacao', 'gerenciar-posicoes', 'produtores']
      .filter(page => visiblePages.includes(page))
      .map(page => ({
        path: `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      }))

    if (operationItems.length > 0) {
      items.push(...operationItems)
    }

    // Fazendas e Contas
    const farmAccountItems = ['fazendas', 'subcontas']
      .filter(page => visiblePages.includes(page))
      .map(page => ({
        path: `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      }))

    if (farmAccountItems.length > 0) {
      items.push(...farmAccountItems)
    }

    // Sistema e Configurações
    const systemItems = ['controle-acesso', 'configuracoes']
      .filter(page => visiblePages.includes(page))
      .map(page => ({
        path: `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      }))

    if (systemItems.length > 0) {
      items.push(...systemItems)
    }

    // Suporte e Perfil sempre visíveis se permitidos
    const supportProfileItems = ['suporte', 'perfil']
      .filter(page => visiblePages.includes(page))
      .map(page => ({
        path: `/${page}`,
        label: menuLabels[page as keyof typeof menuLabels],
        icon: iconMap[page as keyof typeof iconMap]
      }))

    if (supportProfileItems.length > 0) {
      items.push(...supportProfileItems)
    }

    return items
  }, [permissions, isLoading])

  return { menuItems, isLoading }
}