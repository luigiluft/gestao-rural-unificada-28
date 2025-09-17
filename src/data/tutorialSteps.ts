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
    action: 'click',
    autoNavigation: false,
    modalTarget: true
  },
  {
    id: 'entradas-tabela',
    title: 'Entrada Registrada com Sucesso',
    description: 'Perfeito! A entrada foi registrada e agora aparece na tabela abaixo. Você pode ver todas as informações da mercadoria registrada.',
    page: '/demo/entradas',
    targetElement: '[data-tutorial="tabela-entradas"]',
    position: 'top',
    action: 'none',
    autoNavigation: false
  },
  {
    id: 'navigate-recebimento',
    title: 'Ir para Recebimento',
    description: 'Agora clique em "Recebimento" no menu lateral para acompanhar o processo de chegada da mercadoria.',
    page: '/demo/entradas',
    targetElement: '[data-tutorial="menu-recebimento"]',
    position: 'bottom',
    action: 'click',
    autoNavigation: false
  },
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
    id: 'card-em-transferencia',
    title: 'Em Transferência - Card',
    description: 'A entrada foi movida para "Em Transferência". Veja o card e clique em Próximo para continuar.',
    page: '/demo/recebimento',
    targetElement: '[data-tutorial="entrada-card-000123457"]',
    position: 'top',
    action: 'none',
    autoNavigation: false
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
    id: 'card-aguardando-conferencia',
    title: 'Aguardando Conferência - Card',
    description: 'A entrada está "Aguardando Conferência". Confira o card e clique em Próximo para ver as opções.',
    page: '/demo/recebimento',
    targetElement: '[data-tutorial="entrada-card-000123458"]',
    position: 'top',
    action: 'none',
    autoNavigation: false
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
    id: 'card-planejamento',
    title: 'Planejamento - Card',
    description: 'A entrada avançou para "Planejamento". Veja o card e clique em Próximo para alocar os pallets.',
    page: '/demo/recebimento',
    targetElement: '[data-tutorial="entrada-card-000123459"]',
    position: 'top',
    action: 'none',
    autoNavigation: false
  },
  {
    id: 'planejar-pallets-button',
    title: 'Botão Planejar Pallets',
    description: 'Clique no botão "Planejar Pallets" para abrir o modal de planejamento.',
    page: '/demo/recebimento',
    targetElement: '[data-tutorial="planejar-pallets-btn"]',
    position: 'left',
    action: 'click',
    autoNavigation: false
  },
  {
    id: 'modal-planejamento',
    title: 'Modal de Planejamento',
    description: 'Este modal permite planejar a distribuição dos pallets. Veja os dados e clique em "Finalizar Planejamento".',
    page: '/demo/recebimento',
    targetElement: '[data-tutorial="modal-planejamento"]',
    position: 'bottom',
    action: 'none',
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