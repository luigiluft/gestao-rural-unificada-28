import { TutorialStep } from '@/contexts/TutorialContext'

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Tutorial do AgroHub',
    description: 'Este tutorial irá guiá-lo através do processo completo do sistema, desde o recebimento até o transporte. Durante o tutorial, você verá dados de demonstração para entender melhor o funcionamento.',
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
  },
  {
    id: 'navigate-entradas',
    title: 'Acessar Entradas',
    description: 'Clique no menu "Entradas" na barra lateral para acessar a seção de registro de mercadorias.',
    page: '/dashboard',
    targetElement: '[data-tutorial="entradas-link"]',
    position: 'right',
    action: 'click',
    autoNavigation: false
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
    id: 'aguardar-modal-entrada',
    title: 'Aguardando Modal de Entrada',
    description: 'Aguarde o formulário de entrada aparecer.',
    page: '/entradas',
    targetElement: '[data-tutorial="formulario-entrada"]',
    position: 'right',
    action: 'wait_modal',
    autoNavigation: false,
    modalTarget: true
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
    id: 'formulario-preenchido-sem-backdrop',
    title: 'Formulário Preenchido Automaticamente',
    description: 'Veja como o formulário foi preenchido automaticamente com os dados da Nota Fiscal. Revise as informações e clique em "Próximo" para continuar.',
    page: '/demo/entradas',
    targetElement: '[data-tutorial="formulario-entrada"]',
    position: 'right',
    action: 'none',
    autoNavigation: false,
    modalTarget: true
  },
  {
    id: 'formulario-preenchido-com-backdrop',
    title: 'Pronto para Registrar',
    description: 'Agora clique no botão "Registrar Entrada" para finalizar o processo de entrada.',
    page: '/demo/entradas',
    targetElement: '[data-tutorial="registrar-entrada-btn"]',
    position: 'top',
    action: 'none',
    autoNavigation: false,
    modalTarget: true
  },
  {
    id: 'registrar-entrada',
    title: 'Registrar a Entrada',
    description: 'Agora clique no botão "Registrar Entrada" para finalizar o processo e registrar a entrada no sistema.',
    page: '/demo/entradas',
    targetElement: '[data-tutorial="registrar-entrada-btn"]',
    position: 'top',
    action: 'click',
    autoNavigation: false,
    modalTarget: true
  },
  {
    id: 'navigate-alocacao',
    title: 'Alocação de Pallets',
    description: 'Agora vamos alocar os pallets nas posições do depósito.',
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
  },
  {
    id: 'verificar-estoque',
    title: 'Verificar Estoque',
    description: 'Vamos verificar se os produtos foram corretamente adicionados ao estoque.',
    page: '/estoque',
    autoNavigation: true,
    position: 'top'
  },
  {
    id: 'navigate-saidas',
    title: 'Criar Saída',
    description: 'Agora vamos criar uma saída de mercadoria do estoque.',
    page: '/saidas',
    autoNavigation: true,
    position: 'bottom'
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
    title: 'Aguardar Aprovação do Produtor',
    description: 'Esta etapa depende da aprovação do produtor. Ele receberá uma notificação para aprovar a saída.',
    page: '/saidas',
    requiresProducer: true,
    dependencies: ['producer_approval'],
    position: 'bottom',
    action: 'wait_producer',
    autoNavigation: false
  },
  {
    id: 'navigate-separacao',
    title: 'Separação de Mercadorias',
    description: 'Com a saída aprovada, vamos para a separação das mercadorias.',
    page: '/separacao',
    autoNavigation: true,
    position: 'bottom'
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
  },
  {
    id: 'navigate-transporte',
    title: 'Transporte',
    description: 'Agora vamos para a seção de transporte para acompanhar a entrega.',
    page: '/transporte',
    autoNavigation: true,
    position: 'bottom'
  },
  {
    id: 'rastreamento',
    title: 'Rastreamento da Entrega',
    description: 'Acompanhe o status da entrega e atualize conforme necessário.',
    page: '/transporte',
    targetElement: '[data-tutorial="rastreamento"]',
    position: 'top',
    autoNavigation: false
  },
  {
    id: 'tutorial-complete',
    title: 'Tutorial Concluído!',
    description: 'Parabéns! Você concluiu o tutorial completo do sistema AgroHub. Agora você conhece todo o fluxo operacional.',
    page: '/',
    autoNavigation: true,
    position: 'bottom'
  }
]