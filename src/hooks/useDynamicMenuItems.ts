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
  expedicao: Truck,
  produtores: UserPlus,
  fazendas: Tractor,
  subcontas: UserCog,
  suporte: HelpCircle,
  perfil: User,
  configuracoes: Settings,
  "controle-acesso": Shield,
  "ondas-alocacao": Waves,
  "gerenciar-posicoes": Grid3X3,
  separacao: Clipboard,
  inventario: Package2
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
  "gerenciar-posicoes": "Posições",
  separacao: "Separação",
  inventario: "Inventário"
}

export const useDynamicMenuItems = () => {
  const { data: permissions = [], isLoading } = usePagePermissions()

  const menuItems = useMemo(() => {
    if (isLoading || !permissions.length) return []

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
      'ondas-alocacao',
      'estoque',
      'inventario',
      'separacao',
      'saidas',
      'expedicao',
      'rastreio',
      'relatorios',
      'usuarios',
      'franquias',
      'franqueados',
      'produtores',
      'perfil',
      'subcontas',
      'suporte'
    ]

    // Adicionar itens na ordem especificada
    orderedPages.forEach(page => {
      if (visiblePages.includes(page)) {
        items.push({
          path: page === 'dashboard' ? '/' : `/${page}`,
          label: menuLabels[page as keyof typeof menuLabels],
          icon: iconMap[page as keyof typeof iconMap]
        })
      }
    })

    return items
  }, [permissions, isLoading])

  return { menuItems, isLoading }
}