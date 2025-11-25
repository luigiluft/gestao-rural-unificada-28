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
    tipo === 'saida' && profile?.role === 'cliente' ? user?.id : (dados as DadosSaida).produtor_destinatario
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
      console.log('📥 NFData recebido no formulário:', nfData);
      
      const nfeDataToSave = {
        numero_nfe: nfData.numeroNF,
        serie: nfData.serie,
        chave_nfe: nfData.chaveNFe,
        data_emissao: nfData.dataEmissao,
        valor_total: nfData.valorTotal,
        emitente_cnpj: nfData.emitente?.cnpj,
        emitente_nome: nfData.emitente?.nome,
        emitente_endereco: nfData.emitente?.endereco,
        emitente_nome_fantasia: nfData.emitente?.nomeFantasia,
        emitente_logradouro: nfData.emitente?.logradouro,
        emitente_numero: nfData.emitente?.numero,
        emitente_complemento: nfData.emitente?.complemento,
        emitente_bairro: nfData.emitente?.bairro,
        emitente_municipio: nfData.emitente?.municipio,
        emitente_uf: nfData.emitente?.uf,
        emitente_cep: nfData.emitente?.cep,
        emitente_codigo_municipio: nfData.emitente?.codigo_municipio,
        emitente_codigo_pais: nfData.emitente?.codigo_pais,
        emitente_telefone: nfData.emitente?.telefone,
        emitente_ie: nfData.emitente?.ie,
        emitente_crt: nfData.emitente?.crt,
        destinatario_cpf_cnpj: nfData.destinatario?.cpfCnpj || nfData.destinatarioCpfCnpj,
        destinatario_nome: nfData.destinatario?.nome,
        destinatario_logradouro: nfData.destinatario?.logradouro,
        destinatario_numero: nfData.destinatario?.numero,
        destinatario_complemento: nfData.destinatario?.complemento,
        destinatario_bairro: nfData.destinatario?.bairro,
        destinatario_municipio: nfData.destinatario?.municipio,
        destinatario_uf: nfData.destinatario?.uf,
        destinatario_cep: nfData.destinatario?.cep,
        destinatario_codigo_municipio: nfData.destinatario?.codigo_municipio,
        destinatario_codigo_pais: nfData.destinatario?.codigo_pais,
        destinatario_pais: nfData.destinatario?.pais,
        destinatario_telefone: nfData.destinatario?.telefone,
        destinatario_ind_ie: nfData.destinatario?.ind_ie,
        destinatario_ie: nfData.destinatario?.ie,
        destinatario_email: nfData.destinatario?.email,
        entrega_cnpj: nfData.entrega?.cnpj,
        entrega_nome: nfData.entrega?.nome,
        entrega_logradouro: nfData.entrega?.logradouro,
        entrega_numero: nfData.entrega?.numero,
        entrega_bairro: nfData.entrega?.bairro,
        entrega_municipio: nfData.entrega?.municipio,
        entrega_uf: nfData.entrega?.uf,
        entrega_cep: nfData.entrega?.cep,
        entrega_telefone: nfData.entrega?.telefone,
        xml_content: nfData.xmlContent,
        // Campos adicionais
        versao_nfe: nfData.versao_nfe,
        cuf: nfData.cuf,
        cnf: nfData.cnf,
        modelo: nfData.modelo,
        dh_emissao: nfData.dh_emissao,
        dh_saida_entrada: nfData.dh_saida_entrada,
        tipo_nf: nfData.tipo_nf,
        id_dest: nfData.id_dest,
        cmun_fg: nfData.cmun_fg,
        tipo_impressao: nfData.tipo_impressao,
        tipo_emissao: nfData.tipo_emissao,
        digito_verificador: nfData.digito_verificador,
        tipo_ambiente: nfData.tipo_ambiente,
        finalidade_nfe: nfData.finalidade_nfe,
        ind_final: nfData.ind_final,
        ind_pres: nfData.ind_pres,
        ind_intermediador: nfData.ind_intermediador,
        processo_emissao: nfData.processo_emissao,
        versao_processo: nfData.versao_processo,
        // Dados de transporte
        modalidade_frete: nfData.modalidade_frete,
        transportadora_cnpj: nfData.transportadora_cnpj,
        transportadora_nome: nfData.transportadora_nome,
        transportadora_endereco: nfData.transportadora_endereco,
        transportadora_municipio: nfData.transportadora_municipio,
        transportadora_uf: nfData.transportadora_uf,
        veiculo_placa: nfData.veiculo_placa,
        veiculo_uf: nfData.veiculo_uf,
        quantidade_volumes: nfData.quantidade_volumes,
        peso_liquido: nfData.peso_liquido,
        peso_bruto: nfData.peso_bruto,
        // Dados de pagamento
        numero_fatura: nfData.numero_fatura,
        valor_original_fatura: nfData.valor_original_fatura,
        valor_desconto_fatura: nfData.valor_desconto_fatura,
        valor_liquido_fatura: nfData.valor_liquido_fatura,
        numero_duplicata: nfData.numero_duplicata,
        data_vencimento_duplicata: nfData.data_vencimento_duplicata,
        valor_duplicata: nfData.valor_duplicata,
        indicador_pagamento: nfData.indicador_pagamento,
        tipo_pagamento: nfData.tipo_pagamento,
        descricao_pagamento: nfData.descricao_pagamento,
        valor_pagamento: nfData.valor_pagamento,
        // Valores totais (inclui ICMS - usar 0 quando não houver valores)
        valor_bc_icms: nfData.valor_bc_icms ?? 0,
        valor_icms: nfData.valor_icms ?? 0,
        valor_icms_desonerado: nfData.valor_icms_desonerado ?? 0,
        valor_fcp: nfData.valor_fcp ?? 0,
        valor_bc_st: nfData.valor_bc_st ?? 0,
        valor_st: nfData.valor_st ?? 0,
        valor_fcp_st: nfData.valor_fcp_st ?? 0,
        valor_fcp_st_ret: nfData.valor_fcp_st_ret ?? 0,
        // Demais totais
        valor_produtos: nfData.valor_produtos,
        valor_frete: nfData.valor_frete,
        valor_seguro: nfData.valor_seguro,
        valor_desconto: nfData.valor_desconto,
        valor_ii: nfData.valor_ii,
        valor_ipi: nfData.valor_ipi,
        valor_ipi_devolvido: nfData.valor_ipi_devolvido,
        valor_pis: nfData.valor_pis,
        valor_cofins: nfData.valor_cofins,
        valor_outros: nfData.valor_outros,
        valor_total_tributos: nfData.valor_total_tributos,
        // Dados de protocolo
        tipo_ambiente_protocolo: nfData.tipo_ambiente_protocolo,
        versao_aplicativo: nfData.versao_aplicativo,
        data_recebimento: nfData.data_recebimento,
        numero_protocolo: nfData.numero_protocolo,
        digest_value: nfData.digest_value,
        codigo_status: nfData.codigo_status,
        motivo_status: nfData.motivo_status,
        // Pedido de compra
        numero_pedido_compra: nfData.numero_pedido_compra,
        // Informações complementares
        informacoes_complementares: nfData.informacoes_complementares
      };
      
      console.log('💾 nfeData preparado para salvar:', nfeDataToSave);
      
      setDados({
        numeroNF: nfData.numeroNF,
        serie: nfData.serie,
        chaveNFe: nfData.chaveNFe,
        naturezaOperacao: nfData.naturezaOperacao,
        dataEntrada: nfData.dataEmissao,
        dataEmissao: nfData.dataEmissao,
        origem: nfData.emitente.nome,
        observacoes: `Importado da NFe ${nfData.numeroNF}/${nfData.serie}\nEmitente: ${nfData.emitente.nome}\nDestinatário: ${nfData.destinatario.nome}`,
        depositoId: franquiaData?.id || '',
        // Mapear todos os dados da NFe para submissão backend
        nfeData: nfeDataToSave
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
        dataFabricacao: item.dataFabricacao,
        // Campos tributários
        descricao_produto: item.descricao_produto,
        ncm: item.ncm,
        cest: item.cest,
        cfop: item.cfop,
        quantidade_comercial: item.quantidade_comercial,
        valor_unitario_comercial: item.valor_unitario_comercial,
        codigo_ean_tributavel: item.codigo_ean_tributavel,
        unidade_tributavel: item.unidade_tributavel,
        quantidade_tributavel: item.quantidade_tributavel,
        valor_unitario_tributavel: item.valor_unitario_tributavel,
        indicador_total: item.indicador_total,
        impostos_icms: item.impostos_icms,
        impostos_ipi: item.impostos_ipi ?? null,
        impostos_pis: item.impostos_pis,
        impostos_cofins: item.impostos_cofins,
        valor_total_tributos_item: item.valor_total_tributos_item ?? 0
      }))
      
      console.log('📦 Itens convertidos com campos tributários:', itensConvertidos)

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
    setNovoItem((prev) => {
      const atualizado = { ...prev, [campo]: valor }
      // Recalcular valor total quando quantidade ou valor unitário mudam
      if (campo === 'quantidade' || campo === 'valorUnitario') {
        atualizado.valorTotal = (atualizado.quantidade || 0) * (atualizado.valorUnitario || 0)
      }
      return atualizado
    })
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