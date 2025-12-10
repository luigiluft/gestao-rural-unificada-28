import { useMemo } from "react"
import { useSimplifiedPermissions } from "./useSimplifiedPermissions"
import { useFranquia } from "@/contexts/FranquiaContext"
import { useUserRole } from "./useUserRole"
import { useClienteModulos } from "./useClienteModulos"
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
  Headphones,
  HelpCircle,
  Home,
  LayoutTemplate,
  MapPin,
  Package,
  PackageCheck,
  PackageOpen,
  Receipt,
  Settings,
  Shield,
  Ship,
  Store,
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
  'movimentos-estoque': 'Movimentos (Kardex)',
  'posicionamento-estoque': 'Posicionamento',
  'saidas': 'Saídas',
  'rastreio': 'Rastreamento Produtor',
  'nfe-entradas': 'NF-e Entradas',
  'nfe-saidas': 'NF-e Saídas',
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
  'transportadoras': 'Transportadoras',
  'produtores': 'Produtores',
  'clientes': 'Clientes',
  'locais-entrega': 'Locais de Entrega',
  'franquias': 'Depósitos',
  'franqueados': 'Operadores',
  'usuarios': 'Usuários',
  'controle-acesso': 'Controle de Acesso',
  'configuracoes': 'Configurações',
  'perfil': 'Perfil',
  'empresas': 'Empresas',
  'fornecedores': 'Fornecedores',
  'subcontas': 'Subcontas',
  'perfis-funcionarios': 'Cargos',
  'funcionarios': 'Folha',
  'contratos': 'Contratos de Serviço',
  'contratos-franquias': 'Contratos com Franquias',
  'faturas': 'Faturas',
  'financeiro': 'Financeiro',
  'receitas': 'Receitas',
  'despesas': 'Despesas',
  'caixa': 'Caixa',
  'royalties': 'Royalties',
  'contas-correntes': 'Contas Correntes',
  'movimentacoes-contas': 'Movimentações',
  'integracoes-bancos': 'Integrações Bancárias',
  'aprovacao-pagamentos': 'Aprovação de Pagamentos',
  'descontos-duplicatas': 'Descontos em Duplicatas',
  'instrucoes': 'Instruções',
  'suporte': 'Suporte',
  'tutorial': 'Tutorial',
  'empresa-matriz': 'Empresa Matriz',
  'atendimento': 'Atendimento',
  'minha-loja': 'Minha Loja',
  'editor-loja': 'Editor da Loja',
  'configurar-impostos': 'Configurar Impostos'
}

const iconMap = {
  'erp': BarChart3,
  'ajuda': HelpCircle,
  'cadastro': FolderOpen,
  'fiscal': FileText,
  'dashboard': Home,
  'catalogo': Package,
  'entradas': ArrowDownToLine,
  'estoque': Archive,
  'movimentos-estoque': ClipboardList,
  'posicionamento-estoque': MapPin,
  'saidas': ArrowUpFromLine,
  'rastreio': MapPin,
  'nfe-entradas': FileText,
  'nfe-saidas': FileText,
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
  'transportadoras': Truck,
  'franqueados': Building2,
  'produtores': Wheat,
  'clientes': Users,
  'locais-entrega': MapPin,
  'franquias': Building,
  'usuarios': Users,
  'controle-acesso': Shield,
  'configuracoes': Settings,
  'perfil': UserCircle,
  'empresas': Building2,
  'fornecedores': Truck,
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
  'contas-correntes': Building,
  'movimentacoes-contas': ArrowUpFromLine,
  'integracoes-bancos': Building2,
  'aprovacao-pagamentos': FileCheck,
  'descontos-duplicatas': Receipt,
  'instrucoes': BookOpen,
  'suporte': HelpCircle,
  'tutorial': BookOpen,
  'empresa-matriz': Building2,
  'atendimento': Headphones,
  'minha-loja': Store,
  'editor-loja': LayoutTemplate,
  'configurar-impostos': Calculator
}

export const useDynamicMenuItems = () => {
  const { permissions, isSubaccount, isLoading } = useSimplifiedPermissions()
  const { selectedFranquia } = useFranquia()
  const { isAdmin, isCliente } = useUserRole()
  const { wmsHabilitado, tmsHabilitado, ecommerceHabilitado, atendimentoHabilitado, isLoading: isLoadingModulos } = useClienteModulos()

  const menuItems = useMemo(() => {
    if (isLoading || isLoadingModulos || !permissions?.length) return []

    const items: MenuItem[] = []

    // Estrutura do ERP com submenus
    const erpStructure = [
      { pageKey: 'rastreio', title: 'Rastreamento Produtor' },
      { 
        title: 'Vendas',
        subPages: ['saidas']
      },
      { 
        title: 'Compras',
        subPages: ['entradas']
      },
      { 
        title: 'Estoque',
        subPages: ['estoque', 'movimentos-estoque', 'posicionamento-estoque']
      },
      { 
        title: 'Financeiro',
        subPages: ['receitas', 'despesas', 'contas-correntes', 'movimentacoes-contas', 'integracoes-bancos', 'aprovacao-pagamentos', 'descontos-duplicatas']
      }
    ]

    // Verificar se tem permissão para pelo menos uma página do ERP
    const allErpPages = ['rastreio', 'saidas', 'entradas', 'estoque', 'movimentos-estoque', 'posicionamento-estoque', 'receitas', 'despesas', 'contas-correntes', 'movimentacoes-contas', 'integracoes-bancos', 'aprovacao-pagamentos', 'descontos-duplicatas']
    const hasErpPermission = allErpPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasErpPermission) {
      const erpSubItems: MenuItem[] = []
      
      erpStructure.forEach(item => {
        if ('subPages' in item && item.subPages) {
          // É um submenu (Vendas, Compras, Financeiro)
          const nestedSubItems: MenuItem[] = []
          
          item.subPages.forEach(page => {
            const pageViewPermission = `${page}.view`
            if (!permissions.includes(pageViewPermission as any)) return
            
            const label = menuLabels[page as keyof typeof menuLabels]
            const icon = iconMap[page as keyof typeof iconMap]
            
            if (label && icon) {
              nestedSubItems.push({
                path: `/${page}`,
                label,
                icon
              })
            }
          })
          
          if (nestedSubItems.length > 0) {
            erpSubItems.push({
              path: `/${item.title.toLowerCase()}`,
              label: item.title,
              icon: item.title === 'Vendas' ? TrendingUp : item.title === 'Compras' ? ArrowDownToLine : item.title === 'Estoque' ? Archive : DollarSign,
              subItems: nestedSubItems
            })
          }
        } else if ('pageKey' in item) {
          // É uma página direta (Rastreamento Produtor)
          const pageViewPermission = `${item.pageKey}.view`
          if (!permissions.includes(pageViewPermission as any)) return
          
          const label = menuLabels[item.pageKey as keyof typeof menuLabels]
          const icon = iconMap[item.pageKey as keyof typeof iconMap]
          
          if (label && icon) {
            erpSubItems.push({
              path: `/${item.pageKey}`,
              label,
              icon
            })
          }
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

    // Páginas de Ajuda
    const ajudaPages = [
      'instrucoes',
      'suporte',
      'tutorial'
    ]

    // Páginas Fiscais
    const fiscalPages = [
      'nfe-entradas',
      'nfe-saidas'
    ]

    // Páginas de Cadastro
    const cadastroPages = [
      'perfil',
      'empresas',
      'clientes',
      'fornecedores',
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
      'tabelas-frete',
      'configurar-impostos'
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
      'transportadoras',
      'tabelas-frete',
      'tracking'
    ]

    // Verificar se tem permissão para pelo menos uma página do WMS
    // Ocultar WMS se cliente tiver "Todos os Depósitos" selecionado ou não habilitou o módulo
    const shouldShowWms = !(isCliente && selectedFranquia?.id === "ALL") && 
                          !(isCliente && !wmsHabilitado)
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
    // Ocultar TMS se cliente tiver "Todos os Depósitos" selecionado ou não habilitou o módulo
    const shouldShowTms = !(isCliente && selectedFranquia?.id === "ALL") &&
                          !(isCliente && !tmsHabilitado)
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

    // Verificar se tem permissão para pelo menos uma página Fiscal
    const hasFiscalPermission = fiscalPages.some(page => 
      permissions.includes(`${page}.view` as any)
    )

    if (hasFiscalPermission) {
      const fiscalSubItems: MenuItem[] = []
      
      fiscalPages.forEach(page => {
        const pageViewPermission = `${page}.view`
        
        if (!permissions.includes(pageViewPermission as any)) return

        const label = menuLabels[page as keyof typeof menuLabels]
        const icon = iconMap[page as keyof typeof iconMap]
        
        if (label && icon) {
          fiscalSubItems.push({
            path: `/${page}`,
            label,
            icon
          })
        }
      })

      if (fiscalSubItems.length > 0) {
        // Inserir Fiscal após TMS ou WMS
        const tmsIndex = items.findIndex(item => item.path === '/tms')
        const wmsIndex = items.findIndex(item => item.path === '/wms')
        const insertIndex = tmsIndex !== -1 ? tmsIndex + 1 : wmsIndex !== -1 ? wmsIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/fiscal',
          label: 'Fiscal',
          icon: FileText,
          subItems: fiscalSubItems
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

      // Adicionar Empresa Matriz especificamente para admins (não depende de page_permissions)
      if (isAdmin) {
        cadastroSubItems.push({
          path: '/empresa-matriz',
          label: menuLabels['empresa-matriz'],
          icon: iconMap['empresa-matriz']
        })
      }

      if (cadastroSubItems.length > 0) {
        // Inserir Cadastro após Fiscal, TMS ou WMS
        const fiscalIndex = items.findIndex(item => item.path === '/fiscal')
        const tmsIndex = items.findIndex(item => item.path === '/tms')
        const wmsIndex = items.findIndex(item => item.path === '/wms')
        const insertIndex = fiscalIndex !== -1 ? fiscalIndex + 1 : tmsIndex !== -1 ? tmsIndex + 1 : wmsIndex !== -1 ? wmsIndex + 1 : items.length
        
        items.splice(insertIndex, 0, {
          path: '/cadastro',
          label: 'Cadastro',
          icon: FolderOpen,
          subItems: cadastroSubItems
        })
      }
    }

    // Adicionar E-commerce como submenu (se cliente tiver habilitado)
    const shouldShowEcommerce = isCliente && ecommerceHabilitado
    if (shouldShowEcommerce && permissions.includes('minha-loja.view' as any)) {
      const ecommerceSubItems: MenuItem[] = [
        {
          path: '/minha-loja',
          label: menuLabels['minha-loja'],
          icon: iconMap['minha-loja']
        },
        {
          path: '/editor-loja',
          label: menuLabels['editor-loja'],
          icon: iconMap['editor-loja']
        }
      ]
      
      items.push({
        path: '/ecommerce',
        label: 'E-commerce',
        icon: Store,
        subItems: ecommerceSubItems
      })
    }

    // Adicionar Atendimento como item separado (se cliente tiver habilitado)
    const shouldShowAtendimento = isCliente && atendimentoHabilitado
    if (shouldShowAtendimento && permissions.includes('atendimento.view' as any)) {
      items.push({
        path: '/atendimento',
        label: menuLabels['atendimento'],
        icon: iconMap['atendimento']
      })
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
  }, [permissions, isLoading, isLoadingModulos, selectedFranquia, isAdmin, isCliente, wmsHabilitado, tmsHabilitado, ecommerceHabilitado, atendimentoHabilitado])

  return { menuItems, isLoading: isLoading || isLoadingModulos }
}