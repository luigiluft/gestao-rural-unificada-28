import { Button } from "@/components/ui/button"
import { FormularioGenericoProps, DadosEntrada, DadosSaida } from "./types/formulario.types"
import { useFormularioLogic } from "./hooks/useFormularioLogic"
import { useFormularioValidation } from "./hooks/useFormularioValidation"
import { DadosEntradaSection } from "./sections/DadosEntrada"
import { OperacaoFiscalSection } from "./sections/OperacaoFiscal"
import { DestinatarioTransferenciaSection } from "./sections/DestinatarioTransferencia"
import { OrigemSection } from "./sections/OrigemSection"
import { DestinatarioEntregaSection } from "./sections/DestinatarioEntregaSection"
import { ItensComunsSection } from "./sections/ItensComuns"
import { TransporteFreteSectionUnified } from "./sections/TransporteFreteSectionUnified"
import { AgendamentoSectionSimplified } from "./sections/AgendamentoSectionSimplified"
import { NFeObservacoesSection } from "./sections/NFeObservacoesSection"
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
  const [franquiaNome, setFranquiaNome] = useState<string>('')
  
  const dadosSaida = dados as DadosSaida
  const isCliente = profile?.role === 'cliente'
  const targetClienteId = isCliente ? user?.id : dadosSaida.produtor_destinatario
  const { data: fazendas = [] } = useFazendas(targetClienteId)

  const { validarFormulario, pesoMinimoMopp } = useFormularioValidation({ 
    tipo, 
    dados, 
    itens 
  })

  // Buscar coordenadas do depósito de origem
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

  const criarReserva = useCriarReserva()

  const handleSubmit = async () => {
    if (!validarFormulario()) return

    try {
      if (tipo === 'entrada') {
        const dadosEntrada = dados as DadosEntrada
        const dadosCompletos = {
          ...(dadosEntrada.nfeData || {}),
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
        onSubmit(dadosCompletos)
      } else {
        const dadosSaida = dados as DadosSaida
        let reservaId: string | undefined

        if (dadosSaida.tipo_saida === 'retirada_deposito' && dadosSaida.depositoId) {
          const reserva = await criarReserva.mutateAsync({
            dataSaida: dadosSaida.data_saida,
            horario: dadosSaida.janela_horario,
            depositoId: dados.depositoId
          })
          reservaId = reserva.id
        }

        const isCliente = profile?.role === 'cliente'
        
        if (itens.length === 0) {
          throw new Error("Uma saída deve ter pelo menos um item")
        }

        const itensInvalidos = itens.filter(item => !item.produto_id || !item.quantidade || item.quantidade <= 0)
        if (itensInvalidos.length > 0) {
          throw new Error(`${itensInvalidos.length} itens têm dados inválidos (produto ou quantidade)`)
        }

        const dataInicioJanela = dadosSaida.data_saida ? parseLocalDate(dadosSaida.data_saida) : null
        const janelaEntregaDias = dadosSaida.janela_entrega_dias || 3
        const dataFimJanela = dataInicioJanela ? calculateDeliveryWindowEnd(dataInicioJanela, janelaEntregaDias) : null

        const valorProdutos = itens.reduce((sum, item) => 
          sum + ((item.quantidade || 0) * (item.valorUnitario || 0)), 0
        )

        const saidaData = {
          user_id: user?.id,
          data_saida: dadosSaida.data_saida,
          tipo_saida: dadosSaida.tipo_saida,
          observacoes: dadosSaida.observacoes,
          deposito_id: dados.depositoId,
          status: 'separacao_pendente',
          placa_veiculo: dadosSaida.placa_veiculo || null,
          uf_veiculo: dadosSaida.uf_veiculo || null,
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
          data_inicio_janela: dataInicioJanela ? dataInicioJanela.toISOString().split('T')[0] : null,
          data_fim_janela: dataFimJanela ? dataFimJanela.toISOString().split('T')[0] : null,
          janela_entrega_dias: janelaEntregaDias,
          entrega_logradouro: dadosSaida.entrega_logradouro || null,
          entrega_numero: dadosSaida.entrega_numero || null,
          entrega_complemento: dadosSaida.entrega_complemento || null,
          entrega_bairro: dadosSaida.entrega_bairro || null,
          entrega_municipio: dadosSaida.entrega_municipio || null,
          entrega_uf: dadosSaida.entrega_uf || null,
          entrega_cep: dadosSaida.entrega_cep || null,
          finalidade_nfe: dadosSaida.finalidade_nfe || 'normal',
          nfe_referenciada_chave: dadosSaida.nfe_referenciada_chave || null,
          nfe_referenciada_data: dadosSaida.nfe_referenciada_data || null,
          cfop: dadosSaida.cfop || null,
          gera_financeiro: dadosSaida.gera_financeiro ?? true,
          movimenta_estoque: dadosSaida.movimenta_estoque || 'saida',
          tipo_complemento: dadosSaida.tipo_complemento || null,
          destinatario_transferencia_id: dadosSaida.destinatario_transferencia_id || null,
          cliente_destinatario_id: dadosSaida.cliente_destinatario_id || null,
          modalidade_frete: dadosSaida.modalidade_frete || '0',
          transportadora_id: dadosSaida.transportadora_id || null,
          usar_transportadora_propria: dadosSaida.usar_transportadora_propria ?? true,
          valor_produtos: valorProdutos,
          valor_frete: dadosSaida.valor_frete || 0,
          valor_seguro: dadosSaida.valor_seguro || 0,
          quantidade_volumes: dadosSaida.quantidade_volumes || 0,
          peso_bruto: dadosSaida.peso_bruto || 0,
          peso_liquido: dadosSaida.peso_liquido || 0,
          numero_nfe: dadosSaida.numero_nfe || null,
          serie_nfe: dadosSaida.serie_nfe || '1',
          chave_nfe: dadosSaida.chave_nfe || null,
          itens: itens.map(item => ({
            user_id: user?.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            lote: item.lote || null,
            valor_unitario: item.valorUnitario || 0,
            valor_total: (item.quantidade || 0) * (item.valorUnitario || 0)
          }))
        }

        const { data: response, error: saidaError } = await supabase.functions.invoke('manage-saidas', {
          body: { action: 'create', data: saidaData }
        })

        if (saidaError) {
          if (reservaId && dadosSaida.tipo_saida === 'retirada_deposito') {
            await supabase.functions.invoke('manage-saidas', {
              body: { action: 'delete_reserva', data: { reserva_id: reservaId } }
            })
          }
          throw saidaError
        }

        if (!response?.success) {
          if (reservaId && dadosSaida.tipo_saida === 'retirada_deposito') {
            await supabase.functions.invoke('manage-saidas', {
              body: { action: 'delete_reserva', data: { reserva_id: reservaId } }
            })
          }
          throw new Error(response?.error || 'Erro ao criar saída')
        }

        const saida = response.data
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
      {tipo === 'entrada' ? (
        <DadosEntradaSection
          dados={dados as DadosEntrada}
          onDadosChange={setDados}
          nfData={nfData}
          isTutorialActive={isTutorialActive}
        />
      ) : (
        <>
          {/* 1. Operação Fiscal */}
          <OperacaoFiscalSection
            dados={dados as DadosSaida}
            onDadosChange={setDados}
          />
          
          {/* Transferência (condicional) */}
          {(dados as DadosSaida).finalidade_nfe === 'transferencia' && (
            <DestinatarioTransferenciaSection
              dados={dados as DadosSaida}
              onDadosChange={setDados}
            />
          )}
          
          {/* 2. Origem */}
          <OrigemSection
            dados={dados as DadosSaida}
            onDadosChange={setDados}
          />
          
          {/* 3. Destinatário e Entrega */}
          <DestinatarioEntregaSection
            dados={dados as DadosSaida}
            onDadosChange={setDados}
          />
        </>
      )}

      {/* 4. Itens */}
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

      {/* 5. Transporte e Frete (apenas saída) */}
      {tipo === 'saida' && (
        <TransporteFreteSectionUnified
          dados={dados as DadosSaida}
          onDadosChange={setDados}
          itens={itens}
          produtosInfo={estoque.map((e: any) => ({
            id: e.produto_id,
            package_capacity: e.package_capacity,
            containers_per_package: e.containers_per_package
          }))}
          franquiaCoords={franquiaCoords || undefined}
          franquiaNome={franquiaNome}
          pesoTotal={calcularPesoTotal()}
        />
      )}

      {/* 6. Agendamento (apenas saída) */}
      {tipo === 'saida' && dadosSaida.tipo_saida && (
        <AgendamentoSectionSimplified
          dados={dados as DadosSaida}
          onDadosChange={setDados}
          pesoTotal={calcularPesoTotal()}
          pesoMinimoMopp={pesoMinimoMopp}
        />
      )}

      {/* 7. NFe e Observações (apenas saída) */}
      {tipo === 'saida' && (
        <NFeObservacoesSection
          dados={dados as DadosSaida}
          onDadosChange={setDados}
        />
      )}

      {/* Botões de ação */}
      <div className="flex gap-4 justify-end" data-tutorial="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit}>
          {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
        </Button>
      </div>
    </div>
  )
}
