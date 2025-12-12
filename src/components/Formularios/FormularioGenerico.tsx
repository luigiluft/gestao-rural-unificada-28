import { Button } from "@/components/ui/button"
import { FormularioGenericoProps, DadosEntrada, DadosSaida } from "./types/formulario.types"
import { useFormularioLogic } from "./hooks/useFormularioLogic"
import { useFormularioValidation } from "./hooks/useFormularioValidation"
import { DadosEntradaSection } from "./sections/DadosEntrada"
import { DadosSaidaSection } from "./sections/DadosSaida"
import { OperacaoFiscalSection } from "./sections/OperacaoFiscal"
import { DestinatarioTransferenciaSection } from "./sections/DestinatarioTransferencia"
import { ItensComunsSection } from "./sections/ItensComuns"
import { SimuladorFrete } from "./sections/SimuladorFrete"
import { AgendamentoSection } from "./sections/AgendamentoSection"
import { DetalhesEntregaSection } from "./sections/DetalhesEntrega"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useCriarReserva } from "@/hooks/useReservasHorario"
import { useState, useEffect } from "react"
import type { Coordinates } from "@/services/routingService"
import { useFazendas } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"
import { parseLocalDate, calculateDeliveryWindowEnd } from "@/lib/delivery-window"

export function FormularioGenerico({ tipo, onSubmit, onCancel, nfData }: FormularioGenericoProps) {
  const { user } = useAuth()
  const {
    dados,
    setDados,
    itens,
    novoItem,
    adicionarItem,
    removerItem,
    calcularValorTotal,
    calcularPesoTotal,
    handleNovoItemChange,
    estoque,
    produtosFallback,
    clienteProdutos,
    estoqueFEFO,
    profile,
    isTutorialActive
  } = useFormularioLogic({ tipo, nfData })

  const [franquiaCoords, setFranquiaCoords] = useState<Coordinates | null>(null)
  const [fazendaCoords, setFazendaCoords] = useState<Coordinates | null>(null)
  const [franquiaNome, setFranquiaNome] = useState<string>('')
  
  // Para saídas, buscar fazendas do produtor
  const dadosSaida = dados as DadosSaida
  const isCliente = profile?.role === 'cliente'
  const targetClienteId = isCliente ? user?.id : dadosSaida.produtor_destinatario
  const { data: fazendas = [] } = useFazendas(targetClienteId)

  const { validarFormulario, pesoMinimoMopp } = useFormularioValidation({ 
    tipo, 
    dados, 
    itens 
  })

  // Buscar coordenadas do depósito de origem (franquia selecionada)
  useEffect(() => {
    const fetchFranquiaCoords = async () => {
      if (!user?.id || tipo !== 'saida') return

      try {
        const { data: response, error } = await supabase.functions.invoke('manage-entradas', {
          body: { 
            action: 'get_franquia_coords', 
            data: { 
              user_id: user.id,
              deposito_id: dadosSaida.depositoId 
            } 
          }
        })

        if (error) throw error

        if (response?.success && response.data) {
          const franquia = response.data
          if (franquia.latitude && franquia.longitude) {
            setFranquiaCoords({
              latitude: Number(franquia.latitude),
              longitude: Number(franquia.longitude)
            })
            setFranquiaNome(franquia.nome)
          } else {
            setFranquiaCoords(null)
          }
        } else {
          setFranquiaCoords(null)
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas da franquia:', error)
        setFranquiaCoords(null)
      }
    }

    fetchFranquiaCoords()
  }, [user?.id, tipo, dadosSaida.depositoId])

  // Buscar coordenadas da fazenda quando selecionada
  useEffect(() => {
    const fetchFazendaCoords = async () => {
      if (!dadosSaida.fazenda_id || tipo !== 'saida') {
        setFazendaCoords(null)
        return
      }

      try {
        const { data: response, error } = await supabase.functions.invoke('manage-entradas', {
          body: { 
            action: 'get_fazenda_coords', 
            data: { fazenda_id: dadosSaida.fazenda_id } 
          }
        })

        if (error) throw error

        if (response?.success && response.data) {
          const fazenda = response.data
          setFazendaCoords({
            latitude: Number(fazenda.latitude),
            longitude: Number(fazenda.longitude)
          })
        } else {
          setFazendaCoords(null)
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas da fazenda:', error)
        setFazendaCoords(null)
      }
    }

    fetchFazendaCoords()
  }, [dadosSaida.fazenda_id, tipo])

  const handleFreteCalculado = (resultado: any) => {
    const updatedDados = {
      ...dadosSaida,
      valor_frete_calculado: resultado.valor_total,
      prazo_entrega_calculado: resultado.prazo_entrega,
      frete_origem: franquiaNome,
      frete_destino: fazendas.find(f => f.id === dadosSaida.fazenda_id)?.nome || '',
      frete_distancia: resultado.faixa_aplicada ? 
        (Number(resultado.faixa_aplicada.distancia_min) + Number(resultado.faixa_aplicada.distancia_max)) / 2 : 
        undefined
    }
    setDados(updatedDados)
  }

  const criarReserva = useCriarReserva()

  const handleSubmit = async () => {
    if (!validarFormulario()) return

    try {
      if (tipo === 'entrada') {
        const dadosEntrada = dados as DadosEntrada
        const dadosCompletos = {
          // Incluir TODOS os campos da NFe primeiro se disponíveis
          ...(dadosEntrada.nfeData || {}),
          // Sobrescrever com campos específicos do formulário
          data_entrada: dadosEntrada.dataEntrada,
          numero_nfe: dadosEntrada.numeroNF,
          serie: dadosEntrada.serie,
          chave_nfe: dadosEntrada.chaveNFe,
          natureza_operacao: dadosEntrada.naturezaOperacao,
          data_emissao: dadosEntrada.dataEmissao,
          emitente_nome: dadosEntrada.origem,
          observacoes: dadosEntrada.observacoes,
          deposito_id: dadosEntrada.depositoId,
          valor_total: calcularValorTotal(),
          tipo: nfData ? 'nfe' : 'manual',
          xml_content: nfData?.xmlContent,
          itens: itens.map(item => ({
            produto_id: item.produto_id,
            nome_produto: item.produto || item.produtoNome,
            codigo_produto: item.codigo,
            codigo_ean: item.codigoEAN,
            quantidade: item.quantidade,
            unidade_comercial: item.unidade,
            valor_unitario: item.valorUnitario,
            valor_total: item.valorTotal,
            lote: item.lote,
            data_validade: item.dataValidade,
            data_fabricacao: item.dataFabricacao,
            // Campos comerciais/tributáveis
            descricao_produto: item.descricao_produto || (item.produto || item.produtoNome),
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
        }
        console.log('📤 Dados completos sendo enviados para edge function:', dadosCompletos)
        onSubmit(dadosCompletos)
      } else {
        // Lógica específica de saída com reservas
        const dadosSaida = dados as DadosSaida
        let reservaId: string | undefined

        // 1. Se for retirada no depósito, criar reserva de horário primeiro
        if (dadosSaida.tipo_saida === 'retirada_deposito' && dadosSaida.depositoId) {
          const reserva = await criarReserva.mutateAsync({
            dataSaida: dadosSaida.data_saida,
            horario: dadosSaida.janela_horario,
            depositoId: dados.depositoId
          })
          reservaId = reserva.id
        }

        // 2. Criar a saída usando edge function
        const isCliente = profile?.role === 'cliente'
        
        // 4. Validar que existe pelo menos um item
        if (itens.length === 0) {
          throw new Error("Uma saída deve ter pelo menos um item")
        }

        // 5. Validar itens antes de criar saída
        const itensInvalidos = itens.filter(item => !item.produto_id || !item.quantidade || item.quantidade <= 0)
        if (itensInvalidos.length > 0) {
          throw new Error(`${itensInvalidos.length} itens têm dados inválidos (produto ou quantidade)`)
        }

        // Calcular janela de entrega
        const dataInicioJanela = dadosSaida.data_saida ? parseLocalDate(dadosSaida.data_saida) : null
        const janelaEntregaDias = dadosSaida.janela_entrega_dias || 3 // Default 3 dias
        const dataFimJanela = dataInicioJanela ? calculateDeliveryWindowEnd(dataInicioJanela, janelaEntregaDias) : null

        const saidaData = {
          user_id: user?.id,
          data_saida: dadosSaida.data_saida,
          tipo_saida: dadosSaida.tipo_saida,
          observacoes: dadosSaida.observacoes,
          deposito_id: dados.depositoId,
          status: 'separacao_pendente',
          placa_veiculo: dadosSaida.placa_veiculo || null,
          nome_motorista: dadosSaida.nome_motorista || null,
          telefone_motorista: dadosSaida.telefone_motorista || null,
          cpf_motorista: dadosSaida.cpf_motorista || null,
          mopp_motorista: dadosSaida.mopp_motorista || null,
          janela_horario: dadosSaida.janela_horario || null,
          criado_por_franqueado: !isCliente,
          status_aprovacao_produtor: isCliente ? 'aprovado' : 'pendente',
          produtor_destinatario_id: isCliente ? user?.id : dadosSaida.produtor_destinatario,
          valor_frete_calculado: dadosSaida.valor_frete_calculado || null,
          reserva_id: reservaId,
          // Campos de janela de entrega
          data_inicio_janela: dataInicioJanela ? dataInicioJanela.toISOString().split('T')[0] : null,
          data_fim_janela: dataFimJanela ? dataFimJanela.toISOString().split('T')[0] : null,
          janela_entrega_dias: janelaEntregaDias,
          // Campos de operação fiscal
          finalidade_nfe: dadosSaida.finalidade_nfe || 'normal',
          nfe_referenciada_chave: dadosSaida.nfe_referenciada_chave || null,
          nfe_referenciada_data: dadosSaida.nfe_referenciada_data || null,
          cfop: dadosSaida.cfop || null,
          gera_financeiro: dadosSaida.gera_financeiro ?? true,
          movimenta_estoque: dadosSaida.movimenta_estoque || 'saida',
          tipo_complemento: dadosSaida.tipo_complemento || null,
          // Campo de transferência
          destinatario_transferencia_id: dadosSaida.destinatario_transferencia_id || null,
          itens: itens.map(item => ({
            user_id: user?.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            lote: item.lote || null,
            valor_unitario: item.valorUnitario || 0,
            valor_total: (item.quantidade || 0) * (item.valorUnitario || 0)
          }))
        }

        console.log("Criando saída via edge function:", saidaData)

        const { data: response, error: saidaError } = await supabase.functions.invoke('manage-saidas', {
          body: { action: 'create', data: saidaData }
        })

        if (saidaError) {
          // Se erro ao criar saída, remover reserva se foi criada
          if (reservaId && dadosSaida.tipo_saida === 'retirada_deposito') {
            await supabase.functions.invoke('manage-saidas', {
              body: { action: 'delete_reserva', data: { reserva_id: reservaId } }
            })
          }
          throw saidaError
        }

        if (!response?.success) {
          // Se erro ao criar saída, remover reserva se foi criada
          if (reservaId && dadosSaida.tipo_saida === 'retirada_deposito') {
            await supabase.functions.invoke('manage-saidas', {
              body: { action: 'delete_reserva', data: { reserva_id: reservaId } }
            })
          }
          throw new Error(response?.error || 'Erro ao criar saída')
        }

        const saida = response.data
        const itensInseridos = saida.itens || []

        if (!itensInseridos || itensInseridos.length === 0) {
          console.error("Erro: nenhum item foi criado na saída")
          throw new Error("Erro ao inserir itens: nenhum item foi criado")
        }

        console.log(`${itensInseridos?.length || 0} itens inseridos com sucesso`)

        toast.success("Saída registrada com sucesso!")
        onSubmit(saida)
      }
    } catch (error) {
      console.error(`Erro ao registrar ${tipo}:`, error)
      toast.error(`Erro ao registrar ${tipo}`)
    }
  }

  return (
    <div className="space-y-6" data-tutorial={`formulario-${tipo}`}>
      {/* Seção de dados específicos */}
      {tipo === 'entrada' ? (
        <DadosEntradaSection
          dados={dados as DadosEntrada}
          onDadosChange={setDados}
          nfData={nfData}
          isTutorialActive={isTutorialActive}
        />
      ) : (
        <>
          <OperacaoFiscalSection
            dados={dados as DadosSaida}
            onDadosChange={setDados}
          />
          {(dados as DadosSaida).finalidade_nfe === 'transferencia' && (
            <DestinatarioTransferenciaSection
              dados={dados as DadosSaida}
              onDadosChange={setDados}
            />
          )}
          <DadosSaidaSection
            dados={dados as DadosSaida}
            onDadosChange={setDados}
            pesoTotal={calcularPesoTotal()}
            pesoMinimoMopp={pesoMinimoMopp}
          />
        </>
      )}

      {/* Seção de itens comum */}
      <ItensComunsSection
        tipo={tipo}
        itens={itens}
        novoItem={novoItem}
        onNovoItemChange={handleNovoItemChange}
        onAdicionarItem={adicionarItem}
        onRemoverItem={removerItem}
        calcularValorTotal={calcularValorTotal}
        estoque={estoque}
        produtosFallback={produtosFallback}
        clienteProdutos={clienteProdutos}
        estoqueFEFO={estoqueFEFO}
        isTutorialActive={isTutorialActive}
        depositoId={dados.depositoId}
      />

      {/* Seção de Detalhes de Entrega - apenas para saídas */}
      {tipo === 'saida' && (
        <DetalhesEntregaSection
          dados={dadosSaida}
          onDadosChange={setDados}
        />
      )}

      {/* Simulador de Frete - apenas para saídas de entrega na fazenda */}
      {tipo === 'saida' && dadosSaida.tipo_saida === 'entrega_fazenda' && calcularPesoTotal() > 0 && (
        <SimuladorFrete 
          pesoTotal={calcularPesoTotal()}
          franquiaCoords={franquiaCoords || undefined}
          fazendaCoords={fazendaCoords || undefined}
          franquiaNome={franquiaNome}
          fazendaNome={fazendas.find(f => f.id === dadosSaida.fazenda_id)?.nome}
          fazendaId={dadosSaida.fazenda_id}
          onFazendaChange={(fazendaId) => setDados({ ...dadosSaida, fazenda_id: fazendaId })}
          produtorDestinatarioId={dadosSaida.cliente_destinatario_id || dadosSaida.produtor_destinatario}
          onFreteCalculado={handleFreteCalculado}
        />
      )}

      {/* Seção de Agendamento - após o simulador de frete */}
      {tipo === 'saida' && (
        (dadosSaida.tipo_saida === 'retirada_deposito' || 
         (dadosSaida.tipo_saida === 'entrega_fazenda' && dadosSaida.prazo_entrega_calculado)
        ) && (
          <AgendamentoSection
            dados={dadosSaida}
            onDadosChange={setDados}
            pesoTotal={calcularPesoTotal()}
            pesoMinimoMopp={pesoMinimoMopp}
          />
        )
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          data-tutorial={`registrar-${tipo}-btn`}
        >
          Registrar {tipo === 'entrada' ? 'Entrada' : 'Saída'}
        </Button>
      </div>
    </div>
  )
}