import { Button } from "@/components/ui/button"
import { FormularioGenericoProps, DadosEntrada, DadosSaida } from "./types/formulario.types"
import { useFormularioLogic } from "./hooks/useFormularioLogic"
import { useFormularioValidation } from "./hooks/useFormularioValidation"
import { DadosEntradaSection } from "./sections/DadosEntrada"
import { DadosSaidaSection } from "./sections/DadosSaida"
import { ItensComunsSection } from "./sections/ItensComuns"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useCriarReserva } from "@/hooks/useReservasHorario"

export function FormularioGenerico({ tipo, onSubmit, onCancel, nfData }: FormularioGenericoProps) {
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
    estoqueFEFO,
    profile,
    user,
    isTutorialActive
  } = useFormularioLogic({ tipo, nfData })

  const { validarFormulario, pesoMinimoMopp } = useFormularioValidation({ 
    tipo, 
    dados, 
    itens 
  })

  const criarReserva = useCriarReserva()

  const handleSubmit = async () => {
    if (!validarFormulario()) return

    try {
      if (tipo === 'entrada') {
        const dadosCompletos = {
          ...dados,
          itens,
          valorTotal: calcularValorTotal(),
          tipo: nfData ? 'nfe' : 'manual',
          xmlContent: nfData?.xmlContent
        }
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

        // 2. Criar a saída
        const isProdutor = profile?.role === 'produtor'
        const { data: saida, error: saidaError } = await supabase
          .from("saidas")
          .insert({
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
            criado_por_franqueado: !isProdutor,
            status_aprovacao_produtor: isProdutor ? 'aprovado' : 'pendente',
            produtor_destinatario_id: isProdutor ? user?.id : dadosSaida.produtor_destinatario
          })
          .select()
          .single()

        if (saidaError) {
          // Se erro ao criar saída, remover reserva se foi criada
          if (reservaId && dadosSaida.tipo_saida === 'retirada_deposito') {
            await supabase.from("reservas_horario").delete().eq("id", reservaId)
          }
          throw saidaError
        }

        // 3. Atualizar reserva com o ID da saída
        if (reservaId) {
          await supabase
            .from("reservas_horario")
            .update({ saida_id: saida.id })
            .eq("id", reservaId)
        }

        // 4. Validar que existe pelo menos um item
        if (itens.length === 0) {
          throw new Error("Uma saída deve ter pelo menos um item")
        }

        // 5. Criar os itens da saída
        const itensComSaidaId = itens.map(item => ({
          user_id: user?.id,
          saida_id: saida.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          lote: item.lote,
          valor_unitario: item.valorUnitario || 0,
          valor_total: (item.quantidade || 0) * (item.valorUnitario || 0)
        }))

        // Validar se todos os itens têm produto_id
        const itensInvalidos = itensComSaidaId.filter(item => !item.produto_id)
        if (itensInvalidos.length > 0) {
          throw new Error(`${itensInvalidos.length} itens sem produto válido`)
        }

        const { error: itensError } = await supabase
          .from("saida_itens")
          .insert(itensComSaidaId)

        if (itensError) {
          console.error("Erro ao inserir itens:", itensError)
          throw itensError
        }

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
        <DadosSaidaSection
          dados={dados as DadosSaida}
          onDadosChange={setDados}
          pesoTotal={calcularPesoTotal()}
          pesoMinimoMopp={pesoMinimoMopp}
        />
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
        estoqueFEFO={estoqueFEFO}
        isTutorialActive={isTutorialActive}
        depositoId={dados.depositoId}
      />

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