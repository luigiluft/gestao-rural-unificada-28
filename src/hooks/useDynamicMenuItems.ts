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
  BookOpen,
  Warehouse,
  Navigation,
  Route,
  Calendar as CalendarIcon,
  AlertTriangle,
  Calculator
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
  "perfis-funcionarios": Users,
  instrucoes: BookOpen,
  wms: Warehouse,
  tms: Navigation,
  remessas: Package,
  planejamento: Route,
  viagens: Truck,
  agenda: CalendarIcon,
  tracking: MapPin,
  "proof-of-delivery": FileText,
  ocorrencias: AlertTriangle,
  "tabelas-frete": Calculator,
  "tabela-frete": FileText,
  veiculos: Truck,
  motoristas: Users,
  comprovantes: FileText
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
  "perfis-funcionarios": "Perfis de Funcionários",
  instrucoes: "Instruções",
  wms: "WMS",
  tms: "TMS",
  remessas: "Remessas",
  planejamento: "Planejamento",
  viagens: "Viagens",
  agenda: "Agenda",
  tracking: "Tracking",
  "proof-of-delivery": "Proof of Delivery",
  ocorrencias: "Ocorrências",
  "tabelas-frete": "Tabelas de Frete",
  "tabela-frete": "Tabela de Frete",
  veiculos: "Veículos",
  motoristas: "Motoristas",
  comprovantes: "Comprovantes"
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
      'estoque',
      'saidas',
      'rastreio',
      'relatorios',
      'tabelas-frete',
      'produtores',
      'fazendas',
      'perfil',
      'subcontas',
      'perfis-funcionarios',
      'instrucoes',
      'suporte'
    ]

    // Páginas do WMS
    const wmsPages = [
      'recebimento',
      'alocacao-pallets',
      'gerenciar-posicoes',
      'inventario',
      'separacao',
      'expedicao'
    ]

    // Páginas do TMS
    const tmsPages = [
      'remessas',
      'viagens',
      'proof-of-delivery',
      'comprovantes',
      'ocorrencias',
      'veiculos',
      'motoristas',
      'agenda',
      'tracking',
      'tabela-frete'
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

    // Verificar se tem permissão para pelo menos uma página do WMS
    const hasWmsPermission = wmsPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasWmsPermission) {
      const wmsSubItems: MenuItem[] = []
      
      wmsPages.forEach(page => {
        const pageViewPermission = `${page}.view`
        
        if (!permissions.includes(pageViewPermission as any)) return

        const label = menuLabels[page as keyof typeof menuLabels]
        const icon = iconMap[page as keyof typeof iconMap]
        
        if (label && icon) {
          wmsSubItems.push({
            path: `/${page}`,
            label,
            icon
          })
        }
      })

      if (wmsSubItems.length > 0) {
        // Inserir WMS após estoque
        const estoqueIndex = items.findIndex(item => item.path === '/estoque')
        const insertIndex = estoqueIndex !== -1 ? estoqueIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/wms',
          label: 'WMS',
          icon: iconMap.wms,
          subItems: wmsSubItems
        })
      }
    }

    // Verificar se tem permissão para pelo menos uma página do TMS
    const hasTmsPermission = tmsPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasTmsPermission) {
      const tmsSubItems: MenuItem[] = []
      
      tmsPages.forEach(page => {
        const pageViewPermission = `${page}.view`
        
        if (!permissions.includes(pageViewPermission as any)) return

        const label = menuLabels[page as keyof typeof menuLabels]
        const icon = iconMap[page as keyof typeof iconMap]
        
        if (label && icon) {
          tmsSubItems.push({
            path: `/${page}`,
            label,
            icon
          })
        }
      })

      if (tmsSubItems.length > 0) {
        // Inserir TMS após saídas
        const saidasIndex = items.findIndex(item => item.path === '/saidas')
        const insertIndex = saidasIndex !== -1 ? saidasIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/tms',
          label: 'TMS',
          icon: iconMap.tms,
          subItems: tmsSubItems
        })
      }
    }

    return items
  }, [permissions, isLoading])

  return { menuItems, isLoading }
}