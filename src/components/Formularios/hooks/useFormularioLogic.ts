import { useState, useEffect } from "react"
import { UseFormularioLogicProps, ItemGenerico, DadosEntrada, DadosSaida, FormularioTipo } from "../types/formulario.types"
import { useToast } from "@/hooks/use-toast"
import { useTutorial } from "@/contexts/TutorialContext"
import { useFranquiaByCnpj } from "@/hooks/useFranquiaByCnpj"
import { useEstoque } from "@/hooks/useEstoque"
import { useProdutosFallback } from "@/hooks/useProdutosFallback"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { useEstoquePorProdutoFEFO } from "@/hooks/useEstoquePorProdutoFEFO"
import { getMinScheduleDate } from "@/lib/business-days"
import { useDiasUteisExpedicao } from "@/hooks/useConfiguracoesSistema"
import { supabase } from "@/integrations/supabase/client"

export function useFormularioLogic({ tipo, nfData }: UseFormularioLogicProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { isActive: isTutorialActive } = useTutorial()
  
  // Hooks condicionais baseados no tipo
  const { data: estoque = [] } = useEstoque()
  const { data: produtosFallback = [] } = useProdutosFallback()
  const diasUteisExpedicao = useDiasUteisExpedicao()
  
  // Para entrada - buscar franquia através dos dados de entrega da NFe
  const entregaCnpj = nfData?.entrega?.cnpj
  const entregaIe = nfData?.entrega?.ie
  const { data: franquiaData, isLoading: franquiaLoading } = useFranquiaByCnpj(
    tipo === 'entrada' ? entregaCnpj : undefined, 
    tipo === 'entrada' ? entregaIe : undefined
  )

  // Estado inicial baseado no tipo
  const getInitialDados = (): DadosEntrada | DadosSaida => {
    if (tipo === 'entrada') {
      return {
        numeroNF: '',
        serie: '',
        chaveNFe: '',
        naturezaOperacao: '',
        dataEntrada: '',
        dataEmissao: '',
        origem: '',
        observacoes: '',
        depositoId: ''
      } as DadosEntrada
    } else {
      return {
        data_saida: getMinScheduleDate(diasUteisExpedicao),
        tipo_saida: "",
        observacoes: "",
        depositoId: "",
        produtor_destinatario: "",
        fazenda_id: "",
        placa_veiculo: "",
        nome_motorista: "",
        telefone_motorista: "",
        cpf_motorista: "",
        mopp_motorista: "",
        janela_horario: ""
      } as DadosSaida
    }
  }

  const [dados, setDados] = useState<DadosEntrada | DadosSaida>(getInitialDados())
  const [itens, setItens] = useState<ItemGenerico[]>([])
  const [novoItem, setNovoItem] = useState<ItemGenerico>({
    produto: '',
    produto_id: '',
    produtoNome: '',
    lote: '',
    lote_id: '',
    quantidade: 0,
    unidade: '',
    valorUnitario: 0,
    valorTotal: 0
  })

  // Hook para estoque FEFO (apenas para saída)
  const { data: estoqueFEFO } = useEstoquePorProdutoFEFO(
    tipo === 'saida' && novoItem.produto_id ? novoItem.produto_id : undefined,
    tipo === 'saida' ? dados.depositoId : undefined,
    tipo === 'saida' && profile?.role === 'produtor' ? user?.id : (dados as DadosSaida).produtor_destinatario
  )

  // Carregar dados de tutorial se estiver ativo
  useEffect(() => {
    const loadTutorialData = async () => {
      if (isTutorialActive && tipo === 'entrada') {
        try {
          const { data: tutorialEntrada } = await supabase
            .from('tutorial_entradas')
            .select('*')
            .limit(1)
            .single()

          const { data: tutorialItens } = await supabase
            .from('tutorial_entrada_itens')
            .select('*')
            .eq('tutorial_entrada_id', tutorialEntrada?.id)

          if (tutorialEntrada) {
            setDados({
              numeroNF: tutorialEntrada.numero_nfe || '',
              serie: tutorialEntrada.serie || '',
              chaveNFe: tutorialEntrada.chave_nfe || '',
              naturezaOperacao: tutorialEntrada.natureza_operacao || '',
              dataEntrada: tutorialEntrada.data_entrada || '',
              dataEmissao: tutorialEntrada.data_emissao || '',
              origem: tutorialEntrada.emitente_nome || '',
              observacoes: tutorialEntrada.observacoes || '',
              depositoId: ''
            } as DadosEntrada)
          }

          if (tutorialItens) {
            const itensConvertidos: ItemGenerico[] = tutorialItens.map((item) => ({
              produto: item.nome_produto,
              lote: item.lote || '',
              codigo: item.codigo_produto,
              codigoEAN: item.codigo_ean,
              quantidade: item.quantidade,
              unidade: item.unidade_comercial || 'SC',
              deposito: 'Armazém A',
              valorUnitario: item.valor_unitario || 0,
              valorTotal: item.valor_total || 0,
              dataValidade: item.data_validade
            }))
            setItens(itensConvertidos)
          }
        } catch (error) {
          console.error('Erro ao carregar dados do tutorial:', error)
        }
      }
    }

    loadTutorialData()
  }, [isTutorialActive, tipo])

  // Preencher dados quando NFe é carregada (apenas entrada)
  useEffect(() => {
    if (nfData && !isTutorialActive && tipo === 'entrada') {
      setDados({
        numeroNF: nfData.numeroNF,
        serie: nfData.serie,
        chaveNFe: nfData.chaveNFe,
        naturezaOperacao: nfData.naturezaOperacao,
        dataEntrada: nfData.dataEmissao,
        dataEmissao: nfData.dataEmissao,
        origem: nfData.emitente.nome,
        observacoes: `Importado da NFe ${nfData.numeroNF}/${nfData.serie}\nEmitente: ${nfData.emitente.nome}\nDestinatário: ${nfData.destinatario.nome}`,
        depositoId: franquiaData?.id || ''
      } as DadosEntrada)

      const itensConvertidos: ItemGenerico[] = nfData.itens.map((item: any) => ({
        produto: item.descricao,
        lote: item.lote || '',
        codigo: item.codigo,
        codigoEAN: item.codigoEAN || '',
        quantidade: item.quantidade,
        unidade: item.unidade,
        deposito: 'Armazém A',
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
        dataValidade: item.dataValidade,
        quantidadeLote: item.quantidadeLote,
        dataFabricacao: item.dataFabricacao
      }))

      setItens(itensConvertidos)

      if (franquiaData) {
        toast({
          title: "Franquia identificada",
          description: `Franquia ${franquiaData.nome} selecionada automaticamente pelos dados de entrega.`,
        })
      } else if ((entregaCnpj || entregaIe) && !franquiaLoading) {
        toast({
          title: "Franquia não foi encontrada",
          description: "Não foi possível identificar uma franquia pelos dados de entrega. Selecione manualmente.",
          variant: "destructive"
        })
      }
    }
  }, [nfData, franquiaData, franquiaLoading, entregaCnpj, entregaIe, toast, isTutorialActive, tipo])

  const adicionarItem = () => {
    if (!novoItem.produto && !novoItem.produto_id) {
      toast({ title: "Erro", description: "Selecione um produto", variant: "destructive" })
      return
    }
    
    if (novoItem.quantidade <= 0) {
      toast({ title: "Erro", description: "Informe uma quantidade válida", variant: "destructive" })
      return
    }

    // Validações específicas por tipo
    if (tipo === 'saida' && !novoItem.lote_id) {
      toast({ title: "Erro", description: "Selecione um lote para o produto", variant: "destructive" })
      return
    }

    // Verificar item duplicado
    const itemExistente = itens.find(item => {
      if (tipo === 'entrada') {
        return item.produto === novoItem.produto && item.lote === novoItem.lote
      } else {
        return item.produto_id === novoItem.produto_id && item.lote_id === novoItem.lote_id
      }
    })

    if (itemExistente) {
      toast({ title: "Erro", description: "Item já adicionado. Edite a quantidade se necessário.", variant: "destructive" })
      return
    }

    // Verificar disponibilidade para saída
    if (tipo === 'saida') {
      const loteItem = estoqueFEFO?.find(lote => lote.id === novoItem.lote_id)
      if (!loteItem || loteItem.quantidade_atual < novoItem.quantidade) {
        toast({ 
          title: "Erro", 
          description: `Quantidade indisponível no lote. Disponível: ${loteItem?.quantidade_atual || 0}`, 
          variant: "destructive" 
        })
        return
      }
    }

    const valorTotal = novoItem.quantidade * novoItem.valorUnitario
    setItens([...itens, { ...novoItem, valorTotal }])
    setNovoItem({
      produto: '',
      produto_id: '',
      produtoNome: '',
      lote: '',
      lote_id: '',
      quantidade: 0,
      unidade: '',
      valorUnitario: 0,
      valorTotal: 0
    })
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const calcularValorTotal = () => {
    return itens.reduce((total, item) => total + (item.valorTotal || 0), 0)
  }

  const calcularPesoTotal = () => {
    return itens.reduce((total, item) => total + item.quantidade, 0)
  }

  const handleNovoItemChange = (campo: keyof ItemGenerico, valor: any) => {
    const novoItemAtualizado = { ...novoItem, [campo]: valor }
    
    // Recalcular valor total quando quantidade ou valor unitário mudam
    if (campo === 'quantidade' || campo === 'valorUnitario') {
      novoItemAtualizado.valorTotal = novoItemAtualizado.quantidade * novoItemAtualizado.valorUnitario
    }
    
    setNovoItem(novoItemAtualizado)
  }

  return {
    dados,
    setDados,
    itens,
    setItens,
    novoItem,
    setNovoItem,
    adicionarItem,
    removerItem,
    calcularValorTotal,
    calcularPesoTotal,
    handleNovoItemChange,
    estoque,
    produtosFallback,
    estoqueFEFO,
    franquiaData,
    profile,
    user,
    isTutorialActive
  }
}