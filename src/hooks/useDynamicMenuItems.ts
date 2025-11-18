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
  FolderOpen,
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
  'rastreio': 'Rastreamento Produtor',
  'recebimento': 'Recebimento',
  'alocacao-pallets': 'Alocação de Pallets',
  'gerenciar-posicoes': 'Gerenciar Posições',
  'inventario': 'Inventário',
  'separacao': 'Separação',
  'expedicao': 'Expedição',
  'divergencias': 'Divergências',
  'rastreamento-wms': 'Rastreamento WMS',
  'remessas': 'Remessas',
  'ctes': 'CT-e',
  'planejamento': 'Planejamento',
  'viagens': 'Viagens',
  'proof-of-delivery': 'Prova de Entrega',
  'comprovantes': 'Comprovantes',
  'ocorrencias': 'Ocorrências',
  'veiculos': 'Veículos',
  'motoristas': 'Motoristas',
  'agenda': 'Agenda',
  'tracking': 'Rastreamento TMS',
  'tabelas-frete': 'Tabelas de Frete',
  'franqueados': 'Franqueados',
  'produtores': 'Produtores',
  'fazendas': 'Fazendas',
  'franquias': 'Depósitos',
  'usuarios': 'Usuários',
  'controle-acesso': 'Controle de Acesso',
  'configuracoes': 'Configurações',
  'perfil': 'Perfil',
  'empresas': 'Empresas',
  'subcontas': 'Subcontas',
  'perfis-funcionarios': 'Perfis de Funcionários',
  'contratos': 'Contratos de Serviço',
  'contratos-franquias': 'Contratos com Franquias',
  'faturas': 'Faturas',
  'financeiro': 'Financeiro',
  'royalties': 'Royalties',
  'instrucoes': 'Instruções',
  'suporte': 'Suporte',
  'tutorial': 'Tutorial'
}

const iconMap = {
  'erp': BarChart3,
  'ajuda': HelpCircle,
  'cadastro': FolderOpen,
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
  'rastreamento-wms': MapPin,
  'remessas': Ship,
  'ctes': FileText,
  'planejamento': MapPin,
  'viagens': Truck,
  'proof-of-delivery': FileCheck,
  'comprovantes': Receipt,
  'ocorrencias': AlertTriangle,
  'veiculos': Car,
  'motoristas': User,
  'agenda': Calendar,
  'tracking': MapPin,
  'tabelas-frete': Calculator,
  'franqueados': Building2,
  'produtores': Wheat,
  'fazendas': TreePine,
  'franquias': Building,
  'usuarios': Users,
  'controle-acesso': Shield,
  'configuracoes': Settings,
  'perfil': UserCircle,
  'empresas': Building2,
  'subcontas': UserPlus,
  'perfis-funcionarios': Badge,
  'contratos': FileCheck,
  'contratos-franquias': FileText,
  'faturas': FileText,
  'financeiro': DollarSign,
  'royalties': TrendingUp,
  'instrucoes': BookOpen,
  'suporte': HelpCircle,
  'tutorial': BookOpen
}

export const useDynamicMenuItems = () => {
  const { permissions, isSubaccount, isLoading } = useSimplifiedPermissions()

  const menuItems = useMemo(() => {
    if (isLoading || !permissions?.length) return []

    const items: MenuItem[] = []

    // Páginas do ERP
    const erpPages = [
      'dashboard',
      'entradas',
      'estoque',
      'saidas',
      'royalties',
      'financeiro',
      'faturas'
    ]

    // Páginas de Ajuda
    const ajudaPages = [
      'instrucoes',
      'suporte',
      'tutorial'
    ]

    // Páginas de Cadastro
    const cadastroPages = [
      'perfil',
      'empresas',
      'subcontas',
      'perfis-funcionarios',
      'catalogo',
      'fazendas',
      'franquias',
      'franqueados',
      'produtores',
      'contratos',
      'contratos-franquias',
      'tabelas-frete'
    ]

    // Páginas do WMS
    const wmsPages = [
      'recebimento',
      'alocacao-pallets',
      'gerenciar-posicoes',
      'inventario',
      'separacao',
      'expedicao',
      'divergencias',
      'rastreamento-wms'
    ]

    // Páginas do TMS
    const tmsPages = [
      'remessas',
      'ctes',
      'planejamento',
      'viagens',
      'proof-of-delivery',
      'comprovantes',
      'ocorrencias',
      'veiculos',
      'motoristas',
      'tracking'
    ]

    // Verificar se tem permissão para pelo menos uma página do ERP
    const hasErpPermission = erpPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasErpPermission) {
      const erpSubItems: MenuItem[] = []
      
      erpPages.forEach(page => {
        const pageViewPermission = `${page}.view`
        
        if (!permissions.includes(pageViewPermission as any)) return

        const label = menuLabels[page as keyof typeof menuLabels]
        const icon = iconMap[page as keyof typeof iconMap]
        
        if (label && icon) {
          erpSubItems.push({
            path: page === 'dashboard' ? '/' : `/${page}`,
            label,
            icon
          })
        }
      })

      if (erpSubItems.length > 0) {
        items.push({
          path: '/erp',
          label: 'ERP',
          icon: BarChart3,
          subItems: erpSubItems
        })
      }
    }

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
        // Inserir WMS após ERP
        const erpIndex = items.findIndex(item => item.path === '/erp')
        const insertIndex = erpIndex !== -1 ? erpIndex + 1 : items.length
        
        items.push({
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

    // Verificar se tem permissão para pelo menos uma página de Cadastro
    const hasCadastroPermission = cadastroPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasCadastroPermission) {
      const cadastroSubItems: MenuItem[] = []
      
      cadastroPages.forEach(page => {
        const pageViewPermission = `${page}.view`
        
        if (!permissions.includes(pageViewPermission as any)) return

        const label = menuLabels[page as keyof typeof menuLabels]
        const icon = iconMap[page as keyof typeof iconMap]
        
        if (label && icon) {
          cadastroSubItems.push({
            path: `/${page}`,
            label,
            icon
          })
        }
      })

      if (cadastroSubItems.length > 0) {
        // Inserir Cadastro após TMS ou WMS
        const tmsIndex = items.findIndex(item => item.path === '/tms')
        const wmsIndex = items.findIndex(item => item.path === '/wms')
        const insertIndex = tmsIndex !== -1 ? tmsIndex + 1 : wmsIndex !== -1 ? wmsIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/cadastro',
          label: 'Cadastro',
          icon: FolderOpen,
          subItems: cadastroSubItems
        })
      }
    }

    // Adicionar Rastreamento Produtor após Cadastro
    if (permissions.includes('rastreio.view' as any)) {
      const label = menuLabels['rastreio']
      const icon = iconMap['rastreio']
      
      if (label && icon) {
        const cadastroIndex = items.findIndex(item => item.path === '/cadastro')
        const insertIndex = cadastroIndex !== -1 ? cadastroIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/rastreio',
          label,
          icon
        })
      }
    }

    // Adicionar páginas de Ajuda (sempre disponíveis para todos)
    const ajudaSubItems: MenuItem[] = []
    
    ajudaPages.forEach(page => {
      const label = menuLabels[page as keyof typeof menuLabels]
      const icon = iconMap[page as keyof typeof iconMap]
      
      if (label && icon) {
        ajudaSubItems.push({
          path: `/${page}`,
          label,
          icon
        })
      }
    })

    if (ajudaSubItems.length > 0) {
      // Inserir Ajuda no final
      items.push({
        path: '/ajuda',
        label: 'Ajuda',
        icon: HelpCircle,
        subItems: ajudaSubItems
      })
    }

    return items
  }, [permissions, isLoading])

  return { menuItems, isLoading }
}