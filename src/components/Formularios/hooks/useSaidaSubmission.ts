import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { parseLocalDate, calculateDeliveryWindowEnd } from "@/lib/delivery-window"

interface SaidaItem {
  produto_id: string
  quantidade: number
  valorUnitario?: number
  lote?: string
}

interface DadosSaida {
  dataSaida: string
  tipoSaida: string
  deposito: { id: string }
  produtorDestinatario?: { user_id: string }
  observacoes?: string
  janelaEntregaDias?: number
  fazenda_id?: string
  frete_distancia?: number
  frete_origem?: string
  frete_destino?: string
  valor_frete_calculado?: number
  prazo_entrega_calculado?: number
  // Cliente destinatário para vendas B2B
  cliente_destinatario_id?: string
  // Local de entrega
  local_entrega_id?: string
  // Natureza da operação
  natureza_operacao?: string
  // Campos de operação fiscal
  finalidade_nfe?: string
  nfe_referenciada_chave?: string
  cfop?: string
  gera_financeiro?: boolean
  movimenta_estoque?: string
  tipo_complemento?: string
  destinatario_transferencia_id?: string
  // Campos de transporte/motorista
  placa_veiculo?: string
  uf_veiculo?: string
  nome_motorista?: string
  cpf_motorista?: string
  telefone_motorista?: string
  // Campos de endereço de entrega
  entrega_logradouro?: string
  entrega_numero?: string
  entrega_complemento?: string
  entrega_bairro?: string
  entrega_municipio?: string
  entrega_uf?: string
  entrega_cep?: string
  // Campos de transporte/frete
  modalidade_frete?: string
  transportadora_id?: string
  // Campos de volumes e peso
  quantidade_volumes?: number
  peso_bruto?: number
  peso_liquido?: number
  valor_frete?: number
  valor_seguro?: number
  // Campos NFe
  numero_nfe?: string
  serie_nfe?: string
  chave_nfe?: string
}

export function useSaidaSubmission() {
  const { user } = useAuth()

  const validarDados = (dados: DadosSaida, itens: SaidaItem[]) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado")
    }

    if (!dados.dataSaida) {
      throw new Error("Data de saída é obrigatória")
    }

    if (!dados.tipoSaida) {
      throw new Error("Tipo de saída é obrigatório")
    }

    if (!dados.deposito?.id) {
      throw new Error("Depósito é obrigatório")
    }

    if (itens.length === 0) {
      throw new Error("Pelo menos um item deve ser adicionado à saída")
    }

    const itensInvalidos = itens.filter(item => !item.produto_id || !item.quantidade || item.quantidade <= 0)
    if (itensInvalidos.length > 0) {
      throw new Error(`${itensInvalidos.length} itens têm dados inválidos (produto ou quantidade)`)
    }
  }

  // Mapear finalidade_nfe para natureza_operacao
  const mapFinalidadeToNatureza = (finalidade: string | undefined): string => {
    switch (finalidade) {
      case 'normal':
        return 'VENDA DE MERCADORIA'
      case 'devolucao':
        return 'DEVOLUÇÃO DE MERCADORIA'
      case 'remessa':
        return 'REMESSA PARA ARMAZENAGEM'
      case 'transferencia':
        return 'TRANSFERÊNCIA DE MERCADORIA'
      case 'complementar':
        return 'NF-E COMPLEMENTAR'
      default:
        return 'VENDA DE MERCADORIA'
    }
  }

  const submitSaida = async (dados: DadosSaida, itens: SaidaItem[]) => {
    try {
      // 1. Validar dados
      validarDados(dados, itens)

      // 2. Calcular janela de entrega
      const janelaEntregaDias = dados.janelaEntregaDias || 3; // padrão 3 dias se não informado
      const dataInicioJanela = parseLocalDate(dados.dataSaida);
      const dataFimJanela = calculateDeliveryWindowEnd(dataInicioJanela, janelaEntregaDias);

      // 3. Gerar natureza_operacao a partir da finalidade_nfe
      const naturezaOperacao = dados.natureza_operacao || mapFinalidadeToNatureza(dados.finalidade_nfe)

      // 4. Preparar dados para a edge function - CONVERTENDO TODOS OS CAMPOS PARA SNAKE_CASE
      const saidaData = {
        user_id: user!.id,
        deposito_id: dados.deposito.id,
        data_saida: dados.dataSaida,
        tipo_saida: dados.tipoSaida,
        observacoes: dados.observacoes || "",
        criado_por_franqueado: true,
        status_aprovacao_produtor: dados.produtorDestinatario ? "pendente" : "nao_aplicavel",
        produtor_destinatario_id: dados.produtorDestinatario?.user_id || null,
        fazenda_id: dados.fazenda_id || null,
        // CRITICAL: Incluir campos de janela de entrega
        data_inicio_janela: dataInicioJanela.toISOString().split('T')[0],
        data_fim_janela: dataFimJanela.toISOString().split('T')[0],
        janela_entrega_dias: janelaEntregaDias,
        // CRITICAL: Incluir campos de frete
        frete_distancia: dados.frete_distancia || null,
        frete_origem: dados.frete_origem || null,
        frete_destino: dados.frete_destino || null,
        valor_frete_calculado: dados.valor_frete_calculado || null,
        // CRITICAL: Incluir cliente_destinatario_id e local_entrega_id
        cliente_destinatario_id: dados.cliente_destinatario_id || null,
        local_entrega_id: dados.local_entrega_id || null,
        // CRITICAL: Incluir natureza_operacao
        natureza_operacao: naturezaOperacao,
        // Campos de operação fiscal
        finalidade_nfe: dados.finalidade_nfe || 'normal',
        nfe_referenciada_chave: dados.nfe_referenciada_chave || null,
        cfop: dados.cfop || null,
        gera_financeiro: dados.gera_financeiro ?? true,
        movimenta_estoque: dados.movimenta_estoque || 'saida',
        tipo_complemento: dados.tipo_complemento || null,
        destinatario_transferencia_id: dados.destinatario_transferencia_id || null,
        // CRITICAL: Incluir campos de transporte/motorista
        placa_veiculo: dados.placa_veiculo || null,
        uf_veiculo: dados.uf_veiculo || null,
        nome_motorista: dados.nome_motorista || null,
        cpf_motorista: dados.cpf_motorista || null,
        telefone_motorista: dados.telefone_motorista || null,
        // CRITICAL: Incluir campos de endereço de entrega
        entrega_logradouro: dados.entrega_logradouro || null,
        entrega_numero: dados.entrega_numero || null,
        entrega_complemento: dados.entrega_complemento || null,
        entrega_bairro: dados.entrega_bairro || null,
        entrega_municipio: dados.entrega_municipio || null,
        entrega_uf: dados.entrega_uf || null,
        entrega_cep: dados.entrega_cep || null,
        // CRITICAL: Incluir campos de transporte/frete adicionais
        modalidade_frete: dados.modalidade_frete || null,
        transportadora_id: dados.transportadora_id || null,
        quantidade_volumes: dados.quantidade_volumes || null,
        peso_bruto: dados.peso_bruto || null,
        peso_liquido: dados.peso_liquido || null,
        valor_frete: dados.valor_frete || null,
        valor_seguro: dados.valor_seguro || null,
        // CRITICAL: Incluir campos NFe
        numero_nfe: dados.numero_nfe || null,
        serie_nfe: dados.serie_nfe || '1',
        chave_nfe: dados.chave_nfe || null,
        itens: itens.map(item => ({
          user_id: user!.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          lote: item.lote || null,
          valor_unitario: item.valorUnitario || 0,
          valor_total: (item.quantidade || 0) * (item.valorUnitario || 0)
        }))
      }

      console.log("Criando saída via edge function:", saidaData)

      // 4. Criar saída usando edge function
      const { data: response, error: saidaError } = await supabase.functions.invoke('manage-saidas', {
        body: { action: 'create', data: saidaData }
      })

      if (saidaError) {
        console.error("Erro ao criar saída:", saidaError)
        throw new Error(`Erro ao criar saída: ${saidaError.message}`)
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao criar saída')
      }

      const saida = response.data
      const itensInseridos = saida.itens || []

      if (!itensInseridos || itensInseridos.length === 0) {
        console.error("Erro: nenhum item foi criado na saída")
        throw new Error("Erro ao inserir itens: nenhum item foi criado")
      }

      console.log(`${itensInseridos?.length || 0} itens inseridos com sucesso`)

      toast.success(`Saída registrada com sucesso! ${itensInseridos?.length || 0} itens adicionados.`)
      
      return saida

    } catch (error) {
      console.error("Erro completo ao registrar saída:", error)
      toast.error(error instanceof Error ? error.message : "Erro desconhecido ao registrar saída")
      throw error
    }
  }

  return {
    submitSaida,
    validarDados
  }
}