// Mock data for tutorial demonstrations
export const mockData = {
  // Dashboard Stats
  dashboardStats: {
    totalEstoque: 1245,
    produtosAtivos: 12,
    valorTotal: 45678.90,
    alertas: 3,
    alertasDetalhes: [
      {
        id: "mock-1",
        produtos: { nome: "Herbicida Demo A", unidade_medida: "L" },
        quantidade_atual: 15
      },
      {
        id: "mock-2", 
        produtos: { nome: "Fungicida Demo B", unidade_medida: "KG" },
        quantidade_atual: 8
      },
      {
        id: "mock-3",
        produtos: { nome: "Inseticida Demo C", unidade_medida: "L" },
        quantidade_atual: 22
      }
    ]
  },

  // Recent Movements
  recentMovements: [
    {
      id: "mov-1",
      tipo_movimentacao: "entrada",
      quantidade: 50,
      data_movimentacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      produtos: { nome: "Herbicida Demo A" },
      lote: "L2024001",
      franquias: { nome: "Depósito Central Demo" }
    },
    {
      id: "mov-2",
      tipo_movimentacao: "saida",
      quantidade: 25,
      data_movimentacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      produtos: { nome: "Fungicida Demo B" },
      lote: "L2024002",
      franquias: { nome: "Depósito Central Demo" }
    },
    {
      id: "mov-3",
      tipo_movimentacao: "entrada",
      quantidade: 100,
      data_movimentacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      produtos: { nome: "Inseticida Demo C" },
      lote: "L2024003",
      franquias: { nome: "Depósito Central Demo" }
    }
  ],

  // Entradas
  entradas: [
    {
      id: "entrada-demo-1",
      numero_nfe: "123456",
      serie: "1",
      data_entrada: new Date().toISOString(),
      data_emissao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      valor_total: 12500.00,
      status_aprovacao: "confirmado",
      observacoes: "Entrada de demonstração do tutorial",
      emitente_nome: "Fornecedor Demo LTDA",
      emitente_cnpj: "12.345.678/0001-90",
      destinatario_cpf_cnpj: "123.456.789-00",
      created_at: new Date().toISOString(),
      fornecedores: { nome: "Fornecedor Demo LTDA" },
      franquias: { nome: "Depósito Central Demo" },
      entrada_itens: [
        {
          id: "item-1",
          quantidade: 50,
          valor_unitario: 125.00,
          valor_total: 6250.00,
          lote: "L2024001",
          nome_produto: "Herbicida Demo A",
          codigo_produto: "HERB001",
          unidade_comercial: "L",
          produtos: { nome: "Herbicida Demo A", unidade_medida: "L" }
        },
        {
          id: "item-2",
          quantidade: 100,
          valor_unitario: 62.50,
          valor_total: 6250.00,
          lote: "L2024002",
          nome_produto: "Fungicida Demo B",
          codigo_produto: "FUNG001",
          unidade_comercial: "KG",
          produtos: { nome: "Fungicida Demo B", unidade_medida: "KG" }
        }
      ]
    },
    {
      id: "entrada-demo-2",
      numero_nfe: "123455",
      serie: "1",
      data_entrada: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      data_emissao: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      valor_total: 7800.00,
      status_aprovacao: "confirmado",
      observacoes: "Segunda entrada de demonstração",
      emitente_nome: "Fornecedor Demo LTDA",
      emitente_cnpj: "12.345.678/0001-90",
      destinatario_cpf_cnpj: "123.456.789-00",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      fornecedores: { nome: "Fornecedor Demo LTDA" },
      franquias: { nome: "Depósito Central Demo" },
      entrada_itens: [
        {
          id: "item-3",
          quantidade: 60,
          valor_unitario: 130.00,
          valor_total: 7800.00,
          lote: "L2024003",
          nome_produto: "Inseticida Demo C",
          codigo_produto: "INSE001",
          unidade_comercial: "L",
          produtos: { nome: "Inseticida Demo C", unidade_medida: "L" }
        }
      ]
    }
  ],

  // Estoque
  estoque: [
    {
      id: "estoque-1",
      produto_id: "prod-1",
      quantidade_atual: 45,
      quantidade_disponivel: 40,
      quantidade_reservada: 5,
      valor_total_estoque: 5625.00,
      data_validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      lotes: ["L2024001"],
      produtos: { nome: "Herbicida Demo A", unidade_medida: "L" },
      franquias: { nome: "Depósito Central Demo" }
    },
    {
      id: "estoque-2", 
      produto_id: "prod-2",
      quantidade_atual: 75,
      quantidade_disponivel: 75,
      quantidade_reservada: 0,
      valor_total_estoque: 4687.50,
      data_validade: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
      lotes: ["L2024002"],
      produtos: { nome: "Fungicida Demo B", unidade_medida: "KG" },
      franquias: { nome: "Depósito Central Demo" }
    },
    {
      id: "estoque-3",
      produto_id: "prod-3", 
      quantidade_atual: 22,
      quantidade_disponivel: 22,
      quantidade_reservada: 0,
      valor_total_estoque: 2860.00,
      data_validade: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString(),
      lotes: ["L2024003"],
      produtos: { nome: "Inseticida Demo C", unidade_medida: "L" },
      franquias: { nome: "Depósito Central Demo" }
    }
  ],

  // Saídas
  saidas: [
    {
      id: "saida-demo-1",
      data_saida: new Date().toISOString(),
      tipo_saida: "venda",
      status: "separacao_pendente",
      status_aprovacao_produtor: "pendente",
      valor_total: 3250.00,
      criado_por_franqueado: true,
      user_id: "user-franqueado",
      produtor_destinatario_id: "user-produtor",
      observacoes: "Saída de demonstração pendente de aprovação",
      created_at: new Date().toISOString(),
      saida_itens: [
        {
          id: "saida-item-1",
          quantidade: 20,
          valor_unitario: 125.00,
          valor_total: 2500.00,
          lote: "L2024001",
          produtos: { nome: "Herbicida Demo A", unidade_medida: "L" }
        },
        {
          id: "saida-item-2",
          quantidade: 12,
          valor_unitario: 62.50,
          valor_total: 750.00,
          lote: "L2024002",
          produtos: { nome: "Fungicida Demo B", unidade_medida: "KG" }
        }
      ]
    },
    {
      id: "saida-demo-2",
      data_saida: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      tipo_saida: "venda",
      status: "entregue",
      status_aprovacao_produtor: "aprovado", 
      valor_total: 1950.00,
      criado_por_franqueado: false,
      user_id: "user-produtor",
      produtor_destinatario_id: "user-produtor",
      observacoes: "Saída própria já entregue",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      saida_itens: [
        {
          id: "saida-item-3", 
          quantidade: 15,
          valor_unitario: 130.00,
          valor_total: 1950.00,
          lote: "L2024003",
          produtos: { nome: "Inseticida Demo C", unidade_medida: "L" }
        }
      ]
    }
  ],

  // Profile Data
  profilesData: {
    criadores: {
      "user-franqueado": { nome: "Franqueado Demo" },
      "user-produtor": { nome: "Você (Produtor Demo)" }
    },
    destinatarios: {
      "user-produtor": { nome: "Você (Produtor Demo)" },
      "user-cliente": { nome: "Cliente Demo LTDA" }
    }
  },

  // Movimentações para produtos específicos
  movimentacoesPorProduto: {
    "prod-1": [
      {
        id: "mov-prod-1-1",
        tipo_movimentacao: "entrada",
        quantidade: 50,
        data_movimentacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        franquias: { nome: "Depósito Central Demo" }
      },
      {
        id: "mov-prod-1-2",
        tipo_movimentacao: "saida",
        quantidade: 5,
        data_movimentacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        franquias: { nome: "Depósito Central Demo" }
      }
    ],
    "prod-2": [
      {
        id: "mov-prod-2-1",
        tipo_movimentacao: "entrada",
        quantidade: 100,
        data_movimentacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        franquias: { nome: "Depósito Central Demo" }
      },
      {
        id: "mov-prod-2-2",
        tipo_movimentacao: "saida",
        quantidade: 25,
        data_movimentacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        franquias: { nome: "Depósito Central Demo" }
      }
    ],
    "prod-3": [
      {
        id: "mov-prod-3-1", 
        tipo_movimentacao: "entrada",
        quantidade: 60,
        data_movimentacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        franquias: { nome: "Depósito Central Demo" }
      },
      {
        id: "mov-prod-3-2",
        tipo_movimentacao: "saida",
        quantidade: 38,
        data_movimentacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        franquias: { nome: "Depósito Central Demo" }
      }
    ]
  }
}