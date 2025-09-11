import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { useEstoque } from "@/hooks/useEstoque"
import { useProdutosFallback } from "@/hooks/useProdutosFallback"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile, useProdutores, useFazendas, useProdutoresComEstoqueNaFranquia } from "@/hooks/useProfile"
import { useEstoquePorProdutoFEFO } from "@/hooks/useEstoquePorProdutoFEFO"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { usePesoMinimoMopp, useHorariosRetirada, useDiasUteisExpedicao } from "@/hooks/useConfiguracoesSistema"
import { getMinScheduleDate, isDateAfterBlockedBusinessDays } from "@/lib/business-days"
import { useHorariosDisponiveis, useDatasSemHorarios, useCriarReserva, useRemoverReserva } from "@/hooks/useReservasHorario"

interface FormularioSaidaProps {
  onSubmit: (dados: any) => void
  onCancel: () => void
}

interface ItemSaida {
  produto_id: string
  produtoNome: string
  lote?: string
  lote_id?: string
  quantidade: number
  unidade: string
  valor_unitario?: number
  valor_total?: number
}

export function FormularioSaida({ onSubmit, onCancel }: FormularioSaidaProps) {
  const { user } = useAuth()
  const { data: estoque = [], isLoading: loadingEstoque } = useEstoque()
  const { data: produtosFallback = [] } = useProdutosFallback()
  const { data: profile } = useProfile()
  const { data: produtores } = useProdutores()
  const { data: produtoresComEstoque, isLoading: isLoadingProdutoresComEstoque } = useProdutoresComEstoqueNaFranquia()
  const pesoMinimoMopp = usePesoMinimoMopp()
  const horariosRetirada = useHorariosRetirada()
  const diasUteisExpedicao = useDiasUteisExpedicao()

  const [dadosSaida, setDadosSaida] = useState({
    data_saida: getMinScheduleDate(diasUteisExpedicao),
    tipo_saida: "",
    observacoes: "",
    deposito_id: "",
    produtor_destinatario: "",
    fazenda_id: "",
    placa_veiculo: "",
    nome_motorista: "",
    telefone_motorista: "",
    cpf_motorista: "",
    mopp_motorista: "",
    janela_horario: ""
  })

  // Hooks para reservas de horário
  const { data: horariosDisponiveis = [] } = useHorariosDisponiveis(
    dadosSaida.data_saida, 
    dadosSaida.tipo_saida === 'retirada_deposito' ? dadosSaida.deposito_id : undefined
  )
  const { data: datasSemHorarios = [] } = useDatasSemHorarios(
    dadosSaida.tipo_saida === 'retirada_deposito' ? dadosSaida.deposito_id : undefined
  )
  const criarReserva = useCriarReserva()
  const removerReserva = useRemoverReserva()

  const [itens, setItens] = useState<ItemSaida[]>([])
  const [novoItem, setNovoItem] = useState<ItemSaida>({
    produto_id: "",
    produtoNome: "",
    lote: "",
    lote_id: "",
    quantidade: 0,
    unidade: "",
    valor_unitario: 0,
    valor_total: 0
  })

  // Detectar tipo de usuário
  const isProdutor = profile?.role === 'produtor'
  const isFranqueado = profile?.role === 'franqueado'

  // Hook para buscar lotes FEFO do produto selecionado
  const { data: estoqueFEFO } = useEstoquePorProdutoFEFO(
    novoItem.produto_id || undefined, 
    dadosSaida.deposito_id || undefined,
    isProdutor ? user?.id : dadosSaida.produtor_destinatario
  )
  
  // DEBUG - Console logs para debugging
  console.log('=== FORMULARIO SAIDA DEBUG ===')
  console.log('user:', user)
  console.log('profile:', profile)
  console.log('isProdutor:', isProdutor)
  console.log('isFranqueado:', isFranqueado)
  console.log('produtoresComEstoque:', produtoresComEstoque)
  console.log('isLoadingProdutoresComEstoque:', isLoadingProdutoresComEstoque)
  console.log('produtores (fallback):', produtores)
  
  // Usar hook correto baseado no tipo de usuário
  const produtoresParaDropdown = isFranqueado ? (produtoresComEstoque || []) : (produtores || [])
  
  console.log('produtoresParaDropdown final:', produtoresParaDropdown)
  console.log('=== FIM DEBUG ===')
  
  // Get the target producer ID for farms (current user if producer, selected producer if franchisee)
  const targetProdutorId = isProdutor ? user?.id : dadosSaida.produtor_destinatario
  
  console.log("targetProdutorId no FormularioSaida:", targetProdutorId)
  console.log("dadosSaida.produtor_destinatario:", dadosSaida.produtor_destinatario)

  const { data: fazendas = [], isLoading: loadingFazendas } = useFazendas(targetProdutorId)

  // Filtrar estoque disponível (quantidade > 0) e agrupar por produto
  const estoqueDisponivel = estoque?.filter(item => 
    (item.quantidade_atual || 0) > 0
  ) || []

  // Definir deposito_id automaticamente se não estiver definido
  useEffect(() => {
    if (!dadosSaida.deposito_id && estoqueDisponivel.length > 0) {
      const primeiroDeposito = estoqueDisponivel[0]?.deposito_id
      if (primeiroDeposito) {
        setDadosSaida(prev => ({ ...prev, deposito_id: primeiroDeposito }))
      }
    }
  }, [estoqueDisponivel, dadosSaida.deposito_id])

  // Processar produtos disponíveis
  const produtosDisponiveis = (() => {
    // Se tem estoque, usar estoque
    if (estoque && estoque.length > 0) {
      const agrupados = estoque.reduce((acc, item) => {
        const produtoId = item.produto_id
        const produtoNome = item.produtos?.nome || `Produto ${item.id}`
        
        if (!acc[produtoId]) {
          acc[produtoId] = {
            id: produtoId,
            nome: produtoNome,
            unidade_medida: item.produtos?.unidade_medida || '',
            quantidade_total: 0,
            itens: []
          }
        }
        
        acc[produtoId].quantidade_total += item.quantidade_atual || 0
        acc[produtoId].itens.push(item)
        
        return acc
      }, {} as Record<string, any>)
      return agrupados
    }
    
    // Fallback: usar lista de produtos
    return produtosFallback.reduce((acc, produto) => {
      acc[produto.id] = {
        id: produto.id,
        nome: produto.nome,
        unidade_medida: produto.unidade_medida || 'UN',
        quantidade_total: 0,
        itens: []
      }
      return acc
    }, {} as Record<string, any>)
  })()

  const produtosArray = Object.values(produtosDisponiveis)

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtosDisponiveis[produtoId]
    if (produto) {
      // Pegar o primeiro item disponível para preencher os dados
      const primeiroItem = produto.itens[0]
      setNovoItem({
        ...novoItem,
        produto_id: produtoId,
        produtoNome: produto.nome,
        unidade: produto.unidade_medida,
        lote: "", // Limpar lote para forçar seleção manual
        lote_id: "",
        valor_unitario: primeiroItem?.valor_medio || 0
      })
    }
  }

  const handleLoteChange = (loteId: string) => {
    const loteItem = estoqueFEFO?.find(lote => lote.id === loteId)
    if (loteItem) {
      setNovoItem({
        ...novoItem,
        lote: loteItem.lote || "",
        lote_id: loteId,
        valor_unitario: 0 // Por enquanto mantém 0, pode ser implementado valor por lote depois
      })
    }
  }

  const handleQuantidadeChange = (quantidade: number) => {
    const valorTotal = quantidade * (novoItem.valor_unitario || 0)
    setNovoItem({
      ...novoItem,
      quantidade,
      valor_total: valorTotal
    })
  }

  const adicionarItem = () => {
    if (!novoItem.produto_id || novoItem.quantidade <= 0) {
      toast.error("Selecione um produto e informe uma quantidade válida")
      return
    }

    if (!novoItem.lote_id) {
      toast.error("Selecione um lote para o produto")
      return
    }

    // Verificar se já existe item com mesmo produto e lote
    const itemExistente = itens.find(item => 
      item.produto_id === novoItem.produto_id && item.lote_id === novoItem.lote_id
    )

    if (itemExistente) {
      toast.error("Item já adicionado. Edite a quantidade se necessário.")
      return
    }

    // Verificar disponibilidade específica do lote
    const loteItem = estoqueFEFO?.find(lote => lote.id === novoItem.lote_id)
    if (!loteItem || loteItem.quantidade_atual < novoItem.quantidade) {
      toast.error(`Quantidade indisponível no lote. Disponível: ${loteItem?.quantidade_atual || 0}`)
      return
    }

    setItens([...itens, { ...novoItem }])
    setNovoItem({
      produto_id: "",
      produtoNome: "",
      lote: "",
      lote_id: "",
      quantidade: 0,
      unidade: "",
      valor_unitario: 0,
      valor_total: 0
    })
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const calcularPesoTotal = () => {
    return itens.reduce((total, item) => {
      // Assumindo que a unidade é em Kg/L
      return total + item.quantidade;
    }, 0);
  };

  const requiredMopp = dadosSaida.tipo_saida === 'retirada_deposito' && calcularPesoTotal() >= pesoMinimoMopp;

  const handleSubmit = async () => {
    // Validações básicas
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item à saída")
      return
    }

    if (!dadosSaida.tipo_saida) {
      toast.error("Selecione o tipo de saída")
      return
    }

    if (!dadosSaida.deposito_id) {
      toast.error("Nenhum depósito disponível para realizar a saída")
      return
    }

    // Validar data de saída após o período bloqueado de dias úteis
    const dataSaida = new Date(dadosSaida.data_saida + 'T00:00:00')
    if (!isDateAfterBlockedBusinessDays(dataSaida, diasUteisExpedicao)) {
      toast.error(`Data de saída deve ser a partir de ${diasUteisExpedicao} dias úteis (mínimo: ${getMinScheduleDate(diasUteisExpedicao)})`)
      return
    }

    // Validações específicas para retirada no depósito
    if (dadosSaida.tipo_saida === 'retirada_deposito') {
      if (!dadosSaida.placa_veiculo || !dadosSaida.nome_motorista || !dadosSaida.telefone_motorista || !dadosSaida.janela_horario) {
        toast.error("Preencha todos os dados do transporte para retirada no depósito")
        return
      }

      // Verificar se o horário ainda está disponível
      if (!horariosDisponiveis.includes(dadosSaida.janela_horario)) {
        toast.error("Este horário já foi reservado. Selecione outro horário disponível.")
        return
      }

      if (requiredMopp && !dadosSaida.mopp_motorista) {
        toast.error(`MOPP obrigatório para cargas acima de ${pesoMinimoMopp} Kg/L`)
        return
      }
    }

    try {
      let reservaId: string | undefined

      // 1. Se for retirada no depósito, criar reserva de horário primeiro
      if (dadosSaida.tipo_saida === 'retirada_deposito' && dadosSaida.deposito_id) {
        const reserva = await criarReserva.mutateAsync({
          dataSaida: dadosSaida.data_saida,
          horario: dadosSaida.janela_horario,
          depositoId: dadosSaida.deposito_id
        })
        reservaId = reserva.id
      }

      // 2. Criar a saída com lógica de aprovação baseada no role do usuário
      const isProdutor = profile?.role === 'produtor'
      const { data: saida, error: saidaError } = await supabase
        .from("saidas")
        .insert({
          user_id: user?.id,
          data_saida: dadosSaida.data_saida,
          tipo_saida: dadosSaida.tipo_saida,
          observacoes: dadosSaida.observacoes,
          deposito_id: dadosSaida.deposito_id,
          status: 'separacao_pendente',
          placa_veiculo: dadosSaida.placa_veiculo || null,
          nome_motorista: dadosSaida.nome_motorista || null,
          telefone_motorista: dadosSaida.telefone_motorista || null,
          cpf_motorista: dadosSaida.cpf_motorista || null,
          mopp_motorista: dadosSaida.mopp_motorista || null,
          janela_horario: dadosSaida.janela_horario || null,
          // Lógica de aprovação
          criado_por_franqueado: !isProdutor, // true se criado por admin/franqueado
          status_aprovacao_produtor: isProdutor ? 'aprovado' : 'pendente', // Auto-aprovado se é produtor
          // Definir destinatário
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

      // Criar os itens da saída
      const itensComSaidaId = itens.map(item => ({
        user_id: user?.id,
        saida_id: saida.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        lote: item.lote
      }))

      const { error: itensError } = await supabase
        .from("saida_itens")
        .insert(itensComSaidaId)

      if (itensError) throw itensError

      toast.success("Saída registrada com sucesso!")
      onSubmit(saida)
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
      toast.error("Erro ao registrar saída")
    }
  }

  return (
    <div className="space-y-6">
      {/* Dados da Saída - PRIMEIRO */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Saída</CardTitle>
          <p className="text-sm text-muted-foreground">
            Informações gerais sobre a saída
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_saida">Data de Saída *</Label>
              <Input
                id="data_saida"
                type="date"
                value={dadosSaida.data_saida}
                min={getMinScheduleDate(diasUteisExpedicao)}
                onChange={(e) => setDadosSaida({ ...dadosSaida, data_saida: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: {diasUteisExpedicao} dias úteis ({getMinScheduleDate(diasUteisExpedicao)})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_saida">Tipo de Saída *</Label>
              <Select value={dadosSaida.tipo_saida} onValueChange={(value) => setDadosSaida({ ...dadosSaida, tipo_saida: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retirada_deposito">Retirada no Depósito</SelectItem>
                  <SelectItem value="entrega_fazenda">Entrega na Fazenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Só mostrar seleção de produtor para franqueados */}
            {isFranqueado && (
              <div className="space-y-2">
                <Label htmlFor="produtor_destinatario">Produtor Destinatário *</Label>
                <Select value={dadosSaida.produtor_destinatario} onValueChange={(value) => setDadosSaida({ ...dadosSaida, produtor_destinatario: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtoresParaDropdown.map((produtor) => (
                      <SelectItem key={produtor.user_id} value={produtor.user_id}>
                        {produtor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mostrar seleção de fazenda quando há produtor selecionado */}
            {(dadosSaida.tipo_saida === 'entrega_fazenda' && (isProdutor || dadosSaida.produtor_destinatario)) && (
              <div className="space-y-2">
                <Label htmlFor="fazenda_id">Fazenda de Destino</Label>
                <Select value={dadosSaida.fazenda_id} onValueChange={(value) => setDadosSaida({ ...dadosSaida, fazenda_id: value })}>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        loadingFazendas 
                          ? "Carregando fazendas..." 
                          : fazendas.length === 0 && targetProdutorId
                            ? "Nenhuma fazenda cadastrada"
                            : "Selecione a fazenda"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fazendas?.map((fazenda) => (
                      <SelectItem key={fazenda.id} value={fazenda.id}>
                        {fazenda.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Seção de transporte para retirada no depósito */}
          {dadosSaida.tipo_saida === 'retirada_deposito' && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm">Dados do Transporte</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placa_veiculo">Placa do Veículo *</Label>
                  <Input
                    id="placa_veiculo"
                    value={dadosSaida.placa_veiculo}
                    onChange={(e) => setDadosSaida({ ...dadosSaida, placa_veiculo: e.target.value })}
                    placeholder="ABC-1234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_motorista">Nome do Motorista *</Label>
                  <Input
                    id="nome_motorista"
                    value={dadosSaida.nome_motorista}
                    onChange={(e) => setDadosSaida({ ...dadosSaida, nome_motorista: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone_motorista">Telefone do Motorista *</Label>
                  <Input
                    id="telefone_motorista"
                    value={dadosSaida.telefone_motorista}
                    onChange={(e) => setDadosSaida({ ...dadosSaida, telefone_motorista: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_motorista">CPF do Motorista</Label>
                  <Input
                    id="cpf_motorista"
                    value={dadosSaida.cpf_motorista}
                    onChange={(e) => setDadosSaida({ ...dadosSaida, cpf_motorista: e.target.value })}
                    placeholder="123.456.789-00"
                  />
                </div>

                {requiredMopp && (
                  <div className="space-y-2">
                    <Label htmlFor="mopp_motorista">MOPP do Motorista *</Label>
                    <Input
                      id="mopp_motorista"
                      value={dadosSaida.mopp_motorista}
                      onChange={(e) => setDadosSaida({ ...dadosSaida, mopp_motorista: e.target.value })}
                      placeholder="Número do MOPP"
                    />
                    <p className="text-xs text-orange-600">
                      MOPP obrigatório para cargas acima de {pesoMinimoMopp} Kg/L
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="janela_horario">Janela de Horário *</Label>
                  <Select value={dadosSaida.janela_horario} onValueChange={(value) => setDadosSaida({ ...dadosSaida, janela_horario: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.map((horario) => (
                        <SelectItem key={horario} value={horario}>
                          {horario}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {datasSemHorarios.includes(dadosSaida.data_saida) && (
                    <p className="text-xs text-orange-600">
                      Horários limitados nesta data
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={dadosSaida.observacoes}
              onChange={(e) => setDadosSaida({ ...dadosSaida, observacoes: e.target.value })}
              placeholder="Observações sobre a saída"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Produtos - SEGUNDO */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Saída</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isFranqueado && !dadosSaida.produtor_destinatario 
              ? "Selecione o produtor destinatário primeiro"
              : "Selecione os produtos que serão enviados"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de novo item - só mostrar se produtor selecionado (para franqueados) */}
          {(isProdutor || dadosSaida.produtor_destinatario) && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
                <div className="lg:col-span-3 space-y-1">
                  <Label className="text-xs font-medium">Produto</Label>
                  <Select value={novoItem.produto_id} onValueChange={handleProdutoChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosArray.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          <span className="font-medium text-sm">{produto.nome}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-4 space-y-1">
                  <Label className="text-xs font-medium">Lote (FEFO)</Label>
                  <Select 
                    value={novoItem.lote_id} 
                    onValueChange={handleLoteChange}
                    disabled={!novoItem.produto_id || !estoqueFEFO || estoqueFEFO.length === 0}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={novoItem.produto_id ? "Selecione o lote" : "Selecione produto primeiro"} />
                    </SelectTrigger>
                    <SelectContent className="w-[400px]">
                      {estoqueFEFO?.map((lote) => (
                        <SelectItem key={lote.id} value={lote.id}>
                          <div className="flex flex-col text-xs w-full">
                            <span className="font-medium">{lote.lote || 'SEM LOTE'}</span>
                            <div className="flex gap-2 text-muted-foreground">
                              <span>Total: {lote.quantidade_atual}</span>
                              {lote.data_validade && (
                                <span className={
                                  lote.status_validade === 'critico' ? 'text-destructive' :
                                  lote.status_validade === 'atencao' ? 'text-warning' : ''
                                }>
                                  {lote.dias_para_vencer}d
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {novoItem.lote_id && estoqueFEFO && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const loteItem = estoqueFEFO.find(l => l.id === novoItem.lote_id)
                        return loteItem ? `Disponível: ${loteItem.quantidade_atual} ${novoItem.unidade}` : ''
                      })()}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-xs font-medium">Quantidade</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={novoItem.quantidade || ''}
                    onChange={(e) => handleQuantidadeChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9"
                    disabled={!novoItem.lote_id}
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-xs font-medium">Unidade</Label>
                  <Input 
                    value={novoItem.unidade} 
                    disabled 
                    className="h-9 bg-muted"
                  />
                </div>

                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-xs font-medium">Ação</Label>
                  <Button onClick={adicionarItem} size="sm" className="w-full h-9">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de itens adicionados */}
          {(isProdutor || dadosSaida.produtor_destinatario) && itens.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="w-[50px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.produtoNome}</TableCell>
                    <TableCell>{item.lote || "-"}</TableCell>
                    <TableCell>{item.quantidade} {item.unidade}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={itens.length === 0}
        >
          Registrar Saída
        </Button>
      </div>
    </div>
  )
}