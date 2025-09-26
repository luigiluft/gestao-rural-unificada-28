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

  const submitSaida = async (dados: DadosSaida, itens: SaidaItem[]) => {
    try {
      // 1. Validar dados
      validarDados(dados, itens)

      // 2. Calcular janela de entrega
      const janelaEntregaDias = dados.janelaEntregaDias || 3; // padrão 3 dias se não informado
      const dataInicioJanela = parseLocalDate(dados.dataSaida);
      const dataFimJanela = calculateDeliveryWindowEnd(dataInicioJanela, janelaEntregaDias);

      // 3. Iniciar transação criando a saída
      const { data: saida, error: saidaError } = await supabase
        .from("saidas")
        .insert({
          user_id: user!.id,
          deposito_id: dados.deposito.id,
          data_saida: dados.dataSaida,
          tipo_saida: dados.tipoSaida,
          observacoes: dados.observacoes || "",
          criado_por_franqueado: true,
          status_aprovacao_produtor: dados.produtorDestinatario ? "pendente" : "nao_aplicavel",
          produtor_destinatario_id: dados.produtorDestinatario?.user_id || null,
          data_inicio_janela: dataInicioJanela.toISOString().split('T')[0],
          data_fim_janela: dataFimJanela.toISOString().split('T')[0],
          janela_entrega_dias: janelaEntregaDias
        })
        .select()
        .single()

      if (saidaError) {
        console.error("Erro ao criar saída:", saidaError)
        throw new Error(`Erro ao criar saída: ${saidaError.message}`)
      }

      if (!saida) {
        throw new Error("Saída não foi criada - dados não retornados")
      }

      console.log("Saída criada com sucesso:", saida.id)

      // 4. Criar todos os itens da saída
      const itensParaInserir = itens.map(item => ({
        user_id: user!.id,
        saida_id: saida.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        lote: item.lote || null,
        valor_unitario: item.valorUnitario || 0,
        valor_total: (item.quantidade || 0) * (item.valorUnitario || 0)
      }))

      const { data: itensInseridos, error: itensError } = await supabase
        .from("saida_itens")
        .insert(itensParaInserir)
        .select()

      if (itensError) {
        console.error("Erro ao inserir itens:", itensError)
        // Tentar deletar a saída criada para manter consistência
        await supabase.from("saidas").delete().eq("id", saida.id)
        throw new Error(`Erro ao inserir itens: ${itensError.message}`)
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