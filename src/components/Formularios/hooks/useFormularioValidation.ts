import { UseFormularioValidationProps, DadosEntrada, DadosSaida } from "../types/formulario.types"
import { useToast } from "@/hooks/use-toast"
import { usePesoMinimoMopp, useDiasUteisExpedicao } from "@/hooks/useConfiguracoesSistema"
import { 
  isDateAfterTotalBusinessDays, 
  getMinScheduleDateWithFreight,
  calculateTotalBusinessDaysRequired 
} from "@/lib/business-days"
import { useHorariosDisponiveis } from "@/hooks/useReservasHorario"

export function useFormularioValidation({ tipo, dados, itens }: UseFormularioValidationProps) {
  const { toast } = useToast()
  const pesoMinimoMopp = usePesoMinimoMopp()
  const diasUteisExpedicao = useDiasUteisExpedicao()

  // Hook para horários disponíveis (apenas para saída)
  const { data: horariosDisponiveis = [] } = useHorariosDisponiveis(
    tipo === 'saida' ? (dados as DadosSaida).data_saida : '',
    tipo === 'saida' && (dados as DadosSaida).tipo_saida === 'retirada_deposito' ? dados.depositoId : undefined
  )

  const validarDadosBasicos = (): boolean => {
    if (itens.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um item", variant: "destructive" })
      return false
    }

    if (!dados.depositoId) {
      toast({ title: "Erro", description: "Selecione um depósito", variant: "destructive" })
      return false
    }

    return true
  }

  const validarDadosEntrada = (): boolean => {
    const dadosEntrada = dados as DadosEntrada
    
    if (!dadosEntrada.numeroNF) {
      toast({ title: "Erro", description: "Informe o número da NF", variant: "destructive" })
      return false
    }

    if (!dadosEntrada.dataEntrada) {
      toast({ title: "Erro", description: "Informe a data de entrada", variant: "destructive" })
      return false
    }

    if (!dadosEntrada.origem) {
      toast({ title: "Erro", description: "Informe a origem/fornecedor", variant: "destructive" })
      return false
    }

    return true
  }

  const validarDadosSaida = (): boolean => {
    const dadosSaida = dados as DadosSaida
    
    if (!dadosSaida.tipo_saida) {
      toast({ title: "Erro", description: "Selecione o tipo de saída", variant: "destructive" })
      return false
    }

    // Validar finalidade fiscal
    if (!dadosSaida.finalidade_nfe) {
      toast({ title: "Erro", description: "Selecione o tipo de operação fiscal", variant: "destructive" })
      return false
    }

    // Validar NF-e referenciada para devolução e complementar
    if (dadosSaida.finalidade_nfe === 'devolucao' || dadosSaida.finalidade_nfe === 'complementar') {
      if (!dadosSaida.nfe_referenciada_chave) {
        toast({ title: "Erro", description: "Informe a chave da NF-e referenciada", variant: "destructive" })
        return false
      }
      if (dadosSaida.nfe_referenciada_chave.length !== 44) {
        toast({ title: "Erro", description: "A chave da NF-e deve ter exatamente 44 dígitos", variant: "destructive" })
        return false
      }
    }

    // Validar tipo de complemento para NF complementar
    if (dadosSaida.finalidade_nfe === 'complementar' && !dadosSaida.tipo_complemento) {
      toast({ title: "Erro", description: "Selecione o tipo de complemento", variant: "destructive" })
      return false
    }

    // Validar data de saída após o período total (configuração + frete)
    const dataSaida = new Date(dadosSaida.data_saida + 'T00:00:00')
    const prazoFrete = dadosSaida.prazo_entrega_calculado || 0
    const totalDias = calculateTotalBusinessDaysRequired(diasUteisExpedicao, prazoFrete)
    
    if (!isDateAfterTotalBusinessDays(dataSaida, diasUteisExpedicao, prazoFrete)) {
      const minDate = getMinScheduleDateWithFreight(diasUteisExpedicao, prazoFrete)
      let descricao = `Data de saída deve ser a partir de ${totalDias} dias úteis`
      
      if (prazoFrete > 0) {
        descricao += ` (${diasUteisExpedicao} config + ${prazoFrete} frete)`
      }
      descricao += ` - mínimo: ${minDate}`
      
      toast({ 
        title: "Erro", 
        description: descricao,
        variant: "destructive" 
      })
      return false
    }

    // Validações específicas para retirada no depósito
    if (dadosSaida.tipo_saida === 'retirada_deposito') {
      if (!dadosSaida.placa_veiculo || !dadosSaida.nome_motorista || !dadosSaida.telefone_motorista || !dadosSaida.janela_horario) {
        toast({ title: "Erro", description: "Preencha todos os dados do transporte para retirada no depósito", variant: "destructive" })
        return false
      }

      // Verificar se o horário ainda está disponível
      if (!horariosDisponiveis.includes(dadosSaida.janela_horario)) {
        toast({ title: "Erro", description: "Este horário já foi reservado. Selecione outro horário disponível.", variant: "destructive" })
        return false
      }

      // Verificar MOPP
      const pesoTotal = itens.reduce((total, item) => total + item.quantidade, 0)
      const requiredMopp = pesoTotal >= pesoMinimoMopp
      if (requiredMopp && !dadosSaida.mopp_motorista) {
        toast({ title: "Erro", description: `MOPP obrigatório para cargas acima de ${pesoMinimoMopp} Kg/L`, variant: "destructive" })
        return false
      }
    }

    return true
  }

  const validarFormulario = (): boolean => {
    if (!validarDadosBasicos()) return false
    
    if (tipo === 'entrada') {
      return validarDadosEntrada()
    } else {
      return validarDadosSaida()
    }
  }

  return {
    validarFormulario,
    horariosDisponiveis,
    pesoMinimoMopp
  }
}