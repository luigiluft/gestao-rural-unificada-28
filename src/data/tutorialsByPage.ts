import { TutorialStep } from '@/contexts/TutorialContext'

// Page-specific tutorial definitions
export interface PageTutorial {
  id: string
  title: string
  description: string
  pageKey: string
  requiredRole?: 'admin' | 'operador' | 'cliente'
  steps: TutorialStep[]
}

export const tutorialsByPage: PageTutorial[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Aprenda a navegar pelo painel principal e visualizar o resumo das operações.',
    pageKey: 'dashboard',
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao AgroHub',
        description: 'Este tutorial irá guiá-lo através do Dashboard, onde você pode ver o resumo das operações do sistema.',
        page: '/dashboard',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard - Visão Geral',
        description: 'Este é o painel principal onde você pode ver o resumo das operações do sistema.',
        page: '/dashboard',
        targetElement: '.dashboard-stats',
        position: 'bottom',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'entradas',
    title: 'Entradas',
    description: 'Aprenda a registrar novas entradas de mercadorias no sistema.',
    pageKey: 'entradas',
    steps: [
      {
        id: 'entradas-overview',
        title: 'Página de Entradas',
        description: 'Aqui você registra novas entradas de mercadorias. Vamos aprender o processo completo.',
        page: '/entradas',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'criar-entrada',
        title: 'Criar Nova Entrada',
        description: 'Clique no botão "Nova Entrada" para iniciar o registro de uma nova mercadoria.',
        page: '/entradas',
        targetElement: '[data-tutorial="nova-entrada-btn"]',
        position: 'bottom',
        action: 'click',
        autoNavigation: false
      },
      {
        id: 'selecionar-arquivo-nf',
        title: 'Selecionar Arquivo da NF',
        description: 'Clique no botão "Selecionar Arquivo" para carregar os dados da Nota Fiscal (simulado no tutorial).',
        page: '/entradas',
        targetElement: '[data-tutorial="selecionar-arquivo-btn"]',
        position: 'top',
        action: 'none',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'formulario-preenchido',
        title: 'Formulário Preenchido',
        description: 'Veja como o formulário foi preenchido automaticamente com os dados da Nota Fiscal. Revise as informações.',
        page: '/demo/entradas',
        targetElement: '[data-tutorial="formulario-entrada"]',
        position: 'right',
        action: 'none',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'registrar-entrada',
        title: 'Registrar Entrada',
        description: 'Clique no botão "Registrar Entrada" para finalizar o processo.',
        page: '/demo/entradas',
        targetElement: '[data-tutorial="registrar-entrada-btn"]',
        position: 'top',
        action: 'click',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'entrada-registrada',
        title: 'Entrada Registrada',
        description: 'Perfeito! A entrada foi registrada e agora aparece na tabela abaixo.',
        page: '/demo/entradas',
        targetElement: '[data-tutorial="tabela-entradas"]',
        position: 'top',
        action: 'none',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'recebimento',
    title: 'Recebimento',
    description: 'Aprenda a gerenciar o recebimento das mercadorias e planejamento de pallets.',
    pageKey: 'recebimento',
    steps: [
      {
        id: 'recebimento-overview',
        title: 'Página de Recebimento',
        description: 'Esta é a página de recebimento onde você gerencia as entradas por status: desde aguardando transporte até o planejamento de pallets.',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="entrada-card-000123456"]',
        position: 'top',
        autoNavigation: false
      },
      {
        id: 'entrada-aguardando-transporte',
        title: 'Entrada Aguardando Transporte',
        description: 'Aqui você vê as entradas que estão aguardando transporte. Clique no botão para marcar como "Em Transferência".',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="avancar-status-aguardando_transporte"]',
        position: 'top',
        action: 'click',
        autoNavigation: false
      },
      {
        id: 'confirmar-em-transferencia',
        title: 'Confirmar Status',
        description: 'Confirme a mudança de status para "Em Transferência".',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="confirmar-acao"]',
        position: 'top',
        action: 'click',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'entrada-em-transferencia',
        title: 'Em Transferência',
        description: 'Agora a entrada está em transferência. Clique para marcar como "Aguardando Conferência".',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="avancar-status-em_transferencia"]',
        position: 'top',
        action: 'click',
        autoNavigation: false
      },
      {
        id: 'confirmar-aguardando-conferencia',
        title: 'Confirmar Status',
        description: 'Confirme a mudança de status para "Aguardando Conferência".',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="confirmar-acao"]',
        position: 'top',
        action: 'click',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'conferencia-opcoes',
        title: 'Opções de Conferência',
        description: 'Agora você pode fazer a conferência manual ou por código de barras. Vamos fazer a conferência manual.',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="conferencia-manual-btn"]',
        position: 'top',
        action: 'click',
        autoNavigation: false
      },
      {
        id: 'finalizar-conferencia',
        title: 'Finalizar Conferência',
        description: 'Clique em "Finalizar Conferência" para completar o processo.',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="confirmar-acao"]',
        position: 'top',
        action: 'click',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'planejamento-pallets',
        title: 'Planejamento de Pallets',
        description: 'Agora vamos planejar como organizar os produtos em pallets. Clique no botão "Planejar Pallets".',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="planejar-pallets-btn"]',
        position: 'left',
        action: 'click',
        autoNavigation: false
      },
      {
        id: 'modal-planejamento',
        title: 'Modal de Planejamento',
        description: 'Este é o modal de planejamento onde você pode visualizar e ajustar a distribuição dos produtos nos pallets.',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="modal-planejamento"]',
        position: 'bottom',
        action: 'none',
        autoNavigation: false,
        modalTarget: true
      },
      {
        id: 'finalizar-planejamento',
        title: 'Finalizar Planejamento',
        description: 'Clique em "Finalizar Planejamento" para confirmar a configuração dos pallets.',
        page: '/demo/recebimento',
        targetElement: '[data-tutorial="finalizar-planejamento-btn"]',
        position: 'top',
        action: 'click',
        autoNavigation: false,
        modalTarget: true
      }
    ]
  },
  {
    id: 'alocacao-pallets',
    title: 'Alocação de Pallets',
    description: 'Aprenda a alocar pallets nas posições do depósito.',
    pageKey: 'alocacao-pallets',
    steps: [
      {
        id: 'alocacao-overview',
        title: 'Alocação de Pallets',
        description: 'Aqui você aloca os pallets planejados nas posições disponíveis do depósito.',
        page: '/alocacao-pallets',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'selecionar-posicoes',
        title: 'Selecionar Posições',
        description: 'Escolha as posições disponíveis no depósito para armazenar os pallets.',
        page: '/alocacao-pallets',
        targetElement: '[data-tutorial="grid-posicoes"]',
        position: 'top',
        autoNavigation: false
      },
      {
        id: 'confirmar-alocacao',
        title: 'Confirmar Alocação',
        description: 'Confirme a alocação dos pallets nas posições selecionadas.',
        page: '/alocacao-pallets',
        targetElement: '[data-tutorial="confirmar-alocacao"]',
        position: 'bottom',
        action: 'click',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Aprenda a visualizar e gerenciar o estoque atual.',
    pageKey: 'estoque',
    steps: [
      {
        id: 'estoque-overview',
        title: 'Visualização do Estoque',
        description: 'Aqui você pode visualizar todo o estoque atual, incluindo produtos, quantidades e posições no depósito.',
        page: '/estoque',
        targetElement: '[data-tutorial="tabela-estoque"]',
        position: 'top',
        autoNavigation: false
      },
      {
        id: 'filtros-estoque',
        title: 'Filtros de Estoque',
        description: 'Use os filtros para encontrar produtos específicos por categoria, produtor ou posição.',
        page: '/estoque',
        targetElement: '[data-tutorial="filtros-estoque"]',
        position: 'bottom',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'saidas',
    title: 'Saídas',
    description: 'Aprenda a criar e gerenciar saídas de mercadorias.',
    pageKey: 'saidas',
    steps: [
      {
        id: 'saidas-overview',
        title: 'Página de Saídas',
        description: 'Aqui você cria e gerencia as saídas de mercadorias do estoque.',
        page: '/saidas',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'nova-saida',
        title: 'Nova Saída',
        description: 'Clique em "Nova Saída" para iniciar o processo de retirada de mercadoria.',
        page: '/saidas',
        targetElement: '[data-tutorial="nova-saida-btn"]',
        position: 'bottom',
        action: 'click',
        autoNavigation: false
      },
      {
        id: 'formulario-saida',
        title: 'Formulário de Saída',
        description: 'Preencha os dados da saída: cliente, produtos e quantidades.',
        page: '/saidas',
        targetElement: '[data-tutorial="formulario-saida"]',
        position: 'right',
        action: 'form_fill',
        autoNavigation: false
      },
      {
        id: 'aguardar-aprovacao',
        title: 'Aguardar Aprovação',
        description: 'Esta etapa depende da aprovação do produtor. Ele receberá uma notificação para aprovar a saída.',
        page: '/saidas',
        requiresProducer: true,
        dependencies: ['producer_approval'],
        position: 'bottom',
        action: 'wait_producer',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'separacao',
    title: 'Separação',
    description: 'Aprenda o processo de separação de mercadorias para saída.',
    pageKey: 'separacao',
    steps: [
      {
        id: 'separacao-overview',
        title: 'Página de Separação',
        description: 'Aqui você realiza a separação física das mercadorias aprovadas para saída.',
        page: '/separacao',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'scanner-pallet',
        title: 'Scanner de Pallet',
        description: 'Use o scanner para identificar o pallet que contém os produtos da saída.',
        page: '/separacao',
        targetElement: '[data-tutorial="scanner-pallet"]',
        position: 'bottom',
        autoNavigation: false
      },
      {
        id: 'separar-itens',
        title: 'Separar Itens',
        description: 'Confirme a separação dos itens do pallet conforme a quantidade solicitada.',
        page: '/separacao',
        targetElement: '[data-tutorial="separar-itens"]',
        position: 'right',
        autoNavigation: false
      },
      {
        id: 'confirmar-separacao',
        title: 'Confirmar Separação',
        description: 'Finalize a separação confirmando todos os itens separados.',
        page: '/separacao',
        targetElement: '[data-tutorial="confirmar-separacao"]',
        position: 'bottom',
        action: 'click',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'transporte',
    title: 'Transporte',
    description: 'Aprenda a acompanhar o transporte e entrega das mercadorias.',
    pageKey: 'transporte',
    steps: [
      {
        id: 'transporte-overview',
        title: 'Página de Transporte',
        description: 'Aqui você acompanha o status de transporte e entrega das mercadorias.',
        page: '/transporte',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'rastreamento',
        title: 'Rastreamento da Entrega',
        description: 'Acompanhe o status da entrega e atualize conforme necessário.',
        page: '/transporte',
        targetElement: '[data-tutorial="rastreamento"]',
        position: 'top',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'inventario',
    title: 'Inventário',
    description: 'Aprenda a realizar inventários e conferências de estoque.',
    pageKey: 'inventario',
    steps: [
      {
        id: 'inventario-overview',
        title: 'Página de Inventário',
        description: 'Aqui você pode realizar inventários completos ou parciais do estoque.',
        page: '/inventario',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'novo-inventario',
        title: 'Novo Inventário',
        description: 'Clique em "Novo Inventário" para iniciar um processo de contagem.',
        page: '/inventario',
        targetElement: '[data-tutorial="novo-inventario-btn"]',
        position: 'bottom',
        action: 'click',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Aprenda a gerar e visualizar relatórios do sistema.',
    pageKey: 'relatorios',
    steps: [
      {
        id: 'relatorios-overview',
        title: 'Página de Relatórios',
        description: 'Aqui você pode gerar diversos relatórios operacionais e gerenciais.',
        page: '/relatorios',
        position: 'bottom',
        autoNavigation: true
      },
      {
        id: 'filtros-relatorio',
        title: 'Filtros de Relatório',
        description: 'Configure os filtros de período, tipo e outros parâmetros para gerar seu relatório.',
        page: '/relatorios',
        targetElement: '[data-tutorial="filtros-relatorio"]',
        position: 'top',
        autoNavigation: false
      }
    ]
  },
  {
    id: 'rastreio',
    title: 'Rastreio',
    description: 'Aprenda a usar o dashboard de rastreamento para acompanhar o fluxo operacional.',
    pageKey: 'rastreio',
    steps: [
      {
        id: 'rastreio-overview',
        title: 'Dashboard de Rastreio',
        description: 'Este dashboard mostra o fluxo completo das operações em tempo real.',
        page: '/rastreio',
        targetElement: '[data-tutorial="dashboard-rastreio"]',
        position: 'top',
        autoNavigation: false
      },
      {
        id: 'filtros-rastreio',
        title: 'Filtros de Rastreio',
        description: 'Use os filtros para visualizar períodos específicos ou tipos de operação.',
        page: '/rastreio',
        targetElement: '[data-tutorial="filtros-rastreio"]',
        position: 'bottom',
        autoNavigation: false
      }
    ]
  }
]

// Helper function to get tutorials available for a specific role
export const getTutorialsForRole = (role: 'admin' | 'operador' | 'cliente') => {
  return tutorialsByPage.filter(tutorial => 
    !tutorial.requiredRole || tutorial.requiredRole === role
  )
}

// Helper function to get tutorial by page key
export const getTutorialByPageKey = (pageKey: string) => {
  return tutorialsByPage.find(tutorial => tutorial.pageKey === pageKey)
}

// Helper function to get all tutorial steps flattened (for backward compatibility)
export const getAllTutorialSteps = (): TutorialStep[] => {
  return tutorialsByPage.flatMap(tutorial => tutorial.steps)
}