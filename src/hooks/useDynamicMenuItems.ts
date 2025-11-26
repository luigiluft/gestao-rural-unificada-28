import { useMemo } from "react"
import { useSimplifiedPermissions } from "./useSimplifiedPermissions"
import { useFranquia } from "@/contexts/FranquiaContext"
import { useUserRole } from "./useUserRole"
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
  'produtores': 'Clientes',
  'locais-entrega': 'Locais de Entrega',
  'franquias': 'Depósitos',
  'franqueados': 'Operadores',
  'usuarios': 'Usuários',
  'controle-acesso': 'Controle de Acesso',
  'configuracoes': 'Configurações',
  'perfil': 'Perfil',
  'empresas': 'Empresas',
  'subcontas': 'Subcontas',
  'perfis-funcionarios': 'Cargos',
  'funcionarios': 'Folha',
  'contratos': 'Contratos de Serviço',
  'contratos-franquias': 'Contratos com Franquias',
  'faturas': 'Faturas',
  'financeiro': 'Financeiro',
  'receitas': 'Receitas',
  'despesas': 'Despesas',
  'caixa': 'Fluxo de Caixa',
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
  'locais-entrega': MapPin,
  'franquias': Building,
  'usuarios': Users,
  'controle-acesso': Shield,
  'configuracoes': Settings,
  'perfil': UserCircle,
  'empresas': Building2,
  'subcontas': UserPlus,
  'perfis-funcionarios': Badge,
  'funcionarios': Users,
  'contratos': FileCheck,
  'contratos-franquias': FileText,
  'faturas': FileText,
  'financeiro': DollarSign,
  'receitas': TrendingUp,
  'despesas': Receipt,
  'caixa': DollarSign,
  'royalties': TrendingUp,
  'instrucoes': BookOpen,
  'suporte': HelpCircle,
  'tutorial': BookOpen
}

export const useDynamicMenuItems = () => {
  const { permissions, isSubaccount, isLoading } = useSimplifiedPermissions()
  const { selectedFranquia } = useFranquia()
  const { isOperador } = useUserRole()

  const menuItems = useMemo(() => {
    if (isLoading || !permissions?.length) return []

    const items: MenuItem[] = []

    // Páginas do OMS (excluindo dashboard que será item separado)
    const omsPages = [
      'entradas',
      'estoque',
      'saidas',
      'rastreio'
    ]

    // Páginas do ERP
    const erpPages = [
      'receitas',
      'despesas',
      'caixa',
      'faturas',
      'royalties'
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
      'usuarios',
      'perfis-funcionarios',
      'funcionarios',
      'catalogo',
      'locais-entrega',
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

    // Adicionar Dashboard como item separado (se tiver permissão)
    if (permissions.includes('dashboard.view' as any)) {
      items.push({
        path: '/',
        label: menuLabels['dashboard'],
        icon: iconMap['dashboard']
      })
    }

    // Verificar se tem permissão para pelo menos uma página do OMS
    const hasOmsPermission = omsPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasOmsPermission) {
      const omsSubItems: MenuItem[] = []
      
      omsPages.forEach(page => {
        const pageViewPermission = `${page}.view`
        
        if (!permissions.includes(pageViewPermission as any)) return

        const label = menuLabels[page as keyof typeof menuLabels]
        const icon = iconMap[page as keyof typeof iconMap]
        
        if (label && icon) {
          omsSubItems.push({
            path: `/${page}`,
            label,
            icon
          })
        }
      })

      if (omsSubItems.length > 0) {
        items.push({
          path: '/oms',
          label: 'OMS',
          icon: BarChart3,
          subItems: omsSubItems
        })
      }
    }

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
            path: `/${page}`,
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
    // Ocultar WMS se operador tiver "Todos os Depósitos" selecionado
    const shouldShowWms = !(isOperador && selectedFranquia?.id === "ALL")
    const hasWmsPermission = wmsPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasWmsPermission && shouldShowWms) {
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
        // Inserir WMS após OMS
        const omsIndex = items.findIndex(item => item.path === '/oms')
        const insertIndex = omsIndex !== -1 ? omsIndex + 1 : items.length
        
        items.push({
          path: '/wms',
          label: 'WMS',
          icon: Package,
          subItems: wmsSubItems
        })
      }
    }

    // Verificar se tem permissão para pelo menos uma página do TMS
    // Ocultar TMS se operador tiver "Todos os Depósitos" selecionado
    const shouldShowTms = !(isOperador && selectedFranquia?.id === "ALL")
    const hasTmsPermission = tmsPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasTmsPermission && shouldShowTms) {
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
  }, [permissions, isLoading, selectedFranquia, isOperador])

  return { menuItems, isLoading }
}