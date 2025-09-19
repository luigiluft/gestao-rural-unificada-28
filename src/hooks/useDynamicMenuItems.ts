import { useMemo } from "react"
import { useSimplifiedPermissions } from "./useSimplifiedPermissions"
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
  Package2,
  BookOpen
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
  "posicoes": Grid3X3,
  separacao: Clipboard,
  inventario: Package2,
  transporte: Truck,
  "perfis-funcionarios": Users,
  instrucoes: BookOpen
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
  "posicoes": "Posições",
  separacao: "Separação",
  inventario: "Inventário",
  transporte: "Transporte",
  "perfis-funcionarios": "Perfis de Funcionários",
  instrucoes: "Instruções"
}

export const useDynamicMenuItems = () => {
  const { permissions, isSubaccount, isLoading } = useSimplifiedPermissions()

  const menuItems = useMemo(() => {
    if (isLoading || !permissions?.length) return []

    const items: MenuItem[] = []

    // Ordem específica definida pelo usuário
    const orderedPages = [
      'dashboard',
      'catalogo', 
      'entradas',
      'recebimento',
      'alocacao-pallets',
      'posicoes',
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
      'instrucoes',
      'suporte'
    ]

    // Adicionar itens na ordem especificada
    orderedPages.forEach(page => {
      const pageViewPermission = `${page}.view`
      
      // Verificar se tem permissão para ver a página
      if (!permissions.includes(pageViewPermission as any)) return

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
  }, [permissions, isLoading])

  return { menuItems, isLoading }
}