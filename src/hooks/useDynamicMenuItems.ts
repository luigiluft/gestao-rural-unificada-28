import { useMemo } from "react"
import { useSimplifiedPermissions } from "./useSimplifiedPermissions"
import { 
  AlertTriangle,
  AlertCircle,
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Badge,
  BarChart3,
  BookOpen,
  Building,
  Building2,
  Calculator,
  Calendar,
  Car,
  ClipboardList,
  DollarSign,
  FileCheck,
  Grid2X2,
  Grid3X3,
  HelpCircle,
  Home,
  MapPin,
  Package,
  PackageCheck,
  PackageOpen,
  Receipt,
  Settings,
  Shield,
  Ship,
  TrendingUp,
  TreePine,
  Truck,
  User,
  UserCircle,
  UserPlus,
  Users,
  Wheat,
  FileText
} from "lucide-react"

export interface MenuItem {
  path: string
  label: string
  icon: any
  badge?: string
  subItems?: MenuItem[]
}

const menuLabels = {
  'dashboard': 'Dashboard',
  'catalogo': 'Catálogo',
  'entradas': 'Entradas',
  'estoque': 'Estoque',
  'saidas': 'Saídas',
  'rastreio': 'Rastreamento',
  'recebimento': 'Recebimento',
  'alocacao-pallets': 'Alocação de Pallets',
  'gerenciar-posicoes': 'Gerenciar Posições',
  'inventario': 'Inventário',
  'separacao': 'Separação',
  'expedicao': 'Expedição',
  'divergencias': 'Divergências',
  'remessas': 'Remessas',
  'planejamento': 'Planejamento',
  'viagens': 'Viagens',
  'proof-of-delivery': 'Prova de Entrega',
  'comprovantes': 'Comprovantes',
  'ocorrencias': 'Ocorrências',
  'veiculos': 'Veículos',
  'motoristas': 'Motoristas',
  'agenda': 'Agenda',
  'tracking': 'Rastreamento',
  'tabela-frete': 'Tabela de Frete',
  'franqueados': 'Franqueados',
  'produtores': 'Produtores',
  'fazendas': 'Fazendas',
  'franquias': 'Franquias',
  'usuarios': 'Usuários',
  'controle-acesso': 'Controle de Acesso',
  'configuracoes': 'Configurações',
  'perfil': 'Perfil',
  'subcontas': 'Subcontas',
  'perfis-funcionarios': 'Perfis de Funcionários',
  'contratos': 'Contratos',
  'faturas': 'Faturas',
  'financeiro': 'Financeiro',
  'royalties': 'Royalties',
  'instrucoes': 'Instruções',
  'suporte': 'Suporte'
}

const iconMap = {
  'dashboard': Home,
  'catalogo': Package,
  'entradas': ArrowDownToLine,
  'estoque': Archive,
  'saidas': ArrowUpFromLine,
  'rastreio': MapPin,
  'recebimento': PackageCheck,
  'alocacao-pallets': Grid3X3,
  'gerenciar-posicoes': Grid2X2,
  'inventario': ClipboardList,
  'separacao': PackageOpen,
  'expedicao': Truck,
  'divergencias': AlertCircle,
  'remessas': Ship,
  'planejamento': MapPin,
  'viagens': Truck,
  'proof-of-delivery': FileCheck,
  'comprovantes': Receipt,
  'ocorrencias': AlertTriangle,
  'veiculos': Car,
  'motoristas': User,
  'agenda': Calendar,
  'tracking': MapPin,
  'tabela-frete': Calculator,
  'franqueados': Building2,
  'produtores': Wheat,
  'fazendas': TreePine,
  'franquias': Building,
  'usuarios': Users,
  'controle-acesso': Shield,
  'configuracoes': Settings,
  'perfil': UserCircle,
  'subcontas': UserPlus,
  'perfis-funcionarios': Badge,
  'contratos': FileCheck,
  'faturas': FileText,
  'financeiro': DollarSign,
  'royalties': TrendingUp,
  'instrucoes': BookOpen,
  'suporte': HelpCircle
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
      'tabelas-frete',
      'produtores',
      'fazendas',
      'perfil',
      'subcontas',
      'perfis-funcionarios',
      'contratos',
      'faturas',
      'financeiro',
      'royalties',
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
      'expedicao',
      'divergencias'
    ]

    // Páginas do TMS
    const tmsPages = [
      'remessas',
      'planejamento',
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
        // Inserir WMS após saídas
        const saidasIndex = items.findIndex(item => item.path === '/saidas')
        const insertIndex = saidasIndex !== -1 ? saidasIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/wms',
          label: 'WMS',
          icon: Package,
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
        // Inserir TMS após WMS
        const wmsIndex = items.findIndex(item => item.path === '/wms')
        const insertIndex = wmsIndex !== -1 ? wmsIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/tms',
          label: 'TMS',
          icon: Truck,
          subItems: tmsSubItems
        })
      }
    }

    return items
  }, [permissions, isLoading])

  return { menuItems, isLoading }
}