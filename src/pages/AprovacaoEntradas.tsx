import { useState, useEffect, useRef } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import AprovacaoEntradasMobile from "@/components/Mobile/AprovacaoEntradasMobile"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, Truck, Eye, AlertTriangle, Plus, Trash2, Scan, Calculator, X, Package } from "lucide-react"
import { useEntradasPendentes, useAtualizarStatusEntrada } from "@/hooks/useEntradasPendentes"
import { format } from "date-fns"
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter"
import { PlanejamentoPallets } from "@/components/Entradas/PlanejamentoPallets"

interface Divergencia {
  produto: string
  quantidade_esperada: number
  quantidade_recebida: number
  motivo: string
  acao_tomada: string
}

interface LeituraBarra {
  codigo: string
  produto_nome: string
  quantidade: number
  timestamp: Date
}

export default function AprovacaoEntradas() {
  const isMobile = useIsMobile()
  
  const { data: entradas, isLoading } = useEntradasPendentes()
  const atualizarStatus = useAtualizarStatusEntrada()
  
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'status' | 'conferencia' | 'conferencia_barras'>('status')
  const [observacoes, setObservacoes] = useState('')
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])
  const [planejamentoModalOpen, setPlanejamentoModalOpen] = useState(false)
  const [selectedEntradaPlanejamento, setSelectedEntradaPlanejamento] = useState<any>(null)
  
  // Estados para conferência por código de barras
  const [codigoBarras, setCodigoBarras] = useState('')
  const [quantidadeBip, setQuantidadeBip] = useState(1)
  const [leituras, setLeituras] = useState<LeituraBarra[]>([])
  const [modoConferencia, setModoConferencia] = useState(false)
  const inputBarrasRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = "Recebimento - AgroHub"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie o recebimento de produtos no AgroHub')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const, icon: Clock },
      'em_transferencia': { label: 'Em Transferência', variant: 'default' as const, icon: Truck },
      'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const, icon: Eye },
      'planejamento': { label: 'Planejamento', variant: 'default' as const, icon: Package },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'aguardando_transporte': 'em_transferencia',
      'em_transferencia': 'aguardando_conferencia',
      'aguardando_conferencia': 'planejamento',
      'planejamento': 'confirmado'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      'aguardando_transporte': 'Marcar como Em Transferência',
      'em_transferencia': 'Marcar como Aguardando Conferência',
      'aguardando_conferencia': 'Realizar Conferência',
      'planejamento': 'Finalizar Planejamento e Enviar para Alocação'
    }
    return statusLabels[currentStatus as keyof typeof statusLabels] || null
  }

  const handleAction = (entrada: any, type: 'status' | 'conferencia' | 'conferencia_barras') => {
    console.log('🔍 handleAction called with type:', type)
    console.log('🔍 entrada:', entrada)
    console.log('🔍 entrada_itens count:', entrada?.entrada_itens?.length || 0)
    console.log('🔍 entrada_itens data:', entrada?.entrada_itens)
    
    setSelectedEntrada(entrada)
    setActionType(type)
    setObservacoes('')
    setDivergencias([])
    setLeituras([])
    setCodigoBarras('')
    setQuantidadeBip(1)
    setModoConferencia(type === 'conferencia_barras')
    setDialogOpen(true)
  }

  // Log para debug do dialog
  useEffect(() => {
    console.log('Dialog state changed - open:', dialogOpen, 'actionType:', actionType)
  }, [dialogOpen, actionType])

  const handleConfirm = async () => {
    if (!selectedEntrada) return

    const nextStatus = getNextStatus(selectedEntrada.status_aprovacao)
    if (!nextStatus) return

    await atualizarStatus.mutateAsync({
      entradaId: selectedEntrada.id,
      novoStatus: nextStatus,
      observacoes: observacoes || undefined,
      divergencias: divergencias.length > 0 ? divergencias : undefined
    })

    setDialogOpen(false)
  }

  const handleIniciarPlanejamento = (entrada: any) => {
    setSelectedEntradaPlanejamento(entrada)
    setPlanejamentoModalOpen(true)
  }

  const handleFinalizarPlanejamento = async () => {
    if (!selectedEntradaPlanejamento) return

    await atualizarStatus.mutateAsync({
      entradaId: selectedEntradaPlanejamento.id,
      novoStatus: 'confirmado'
    })

    setPlanejamentoModalOpen(false)
    setSelectedEntradaPlanejamento(null)
  }

  const addDivergencia = (item?: any) => {
    const novaDivergencia = {
      produto: item ? (item.produtos?.nome || item.nome_produto || '') : '',
      quantidade_esperada: item ? item.quantidade || 0 : 0,
      quantidade_recebida: item ? item.quantidade || 0 : 0,
      motivo: '',
      acao_tomada: ''
    }
    setDivergencias([...divergencias, novaDivergencia])
  }

  const removeDivergencia = (index: number) => {
    setDivergencias(divergencias.filter((_, i) => i !== index))
  }

  const updateDivergencia = (index: number, field: keyof Divergencia, value: any) => {
    const updated = [...divergencias]
    updated[index] = { ...updated[index], [field]: value }
    setDivergencias(updated)
  }

  // Funções para conferência por código de barras
  const processarLeituraBarra = () => {
    if (!codigoBarras.trim() || !selectedEntrada) return

    const item = selectedEntrada.entrada_itens?.find((item: any) => 
      item.produtos?.codigo === codigoBarras.trim() || 
      item.nome_produto?.toLowerCase().includes(codigoBarras.trim().toLowerCase())
    )

    if (!item) {
      // Produto não encontrado na entrada
      const novaLeitura: LeituraBarra = {
        codigo: codigoBarras.trim(),
        produto_nome: `Produto não encontrado (${codigoBarras.trim()})`,
        quantidade: quantidadeBip,
        timestamp: new Date()
      }
      setLeituras([...leituras, novaLeitura])
    } else {
      // Produto encontrado, adicionar ou incrementar
      const leituraExistente = leituras.find(l => l.codigo === codigoBarras.trim())
      
      if (leituraExistente) {
        const novasLeituras = leituras.map(l => 
          l.codigo === codigoBarras.trim() 
            ? { ...l, quantidade: l.quantidade + quantidadeBip, timestamp: new Date() }
            : l
        )
        setLeituras(novasLeituras)
      } else {
        const novaLeitura: LeituraBarra = {
          codigo: codigoBarras.trim(),
          produto_nome: item.produtos?.nome || item.nome_produto || 'Produto sem nome',
          quantidade: quantidadeBip,
          timestamp: new Date()
        }
        setLeituras([...leituras, novaLeitura])
      }
    }

    // Limpar código e focar automaticamente para próxima leitura
    setCodigoBarras('')
    setTimeout(() => {
      if (inputBarrasRef.current) {
        inputBarrasRef.current.focus()
      }
    }, 50)
  }

  const removerLeitura = (codigo: string) => {
    setLeituras(leituras.filter(l => l.codigo !== codigo))
  }

  const diminuirQuantidade = (codigo: string) => {
    setLeituras(leituras.map(l => 
      l.codigo === codigo 
        ? { ...l, quantidade: Math.max(0, l.quantidade - 1) }
        : l
    ).filter(l => l.quantidade > 0))
  }

  const aumentarQuantidade = (codigo: string) => {
    setLeituras(leituras.map(l => 
      l.codigo === codigo 
        ? { ...l, quantidade: l.quantidade + 1, timestamp: new Date() }
        : l
    ))
  }

  const gerarDivergenciasAutomaticas = () => {
    if (!selectedEntrada || !selectedEntrada.entrada_itens) return

    const divergenciasCalculadas: Divergencia[] = []

    // Para cada item esperado, verificar se foi lido
    selectedEntrada.entrada_itens.forEach((itemEsperado: any) => {
      const produto_codigo = itemEsperado.produtos?.codigo
      const produto_nome = itemEsperado.produtos?.nome || itemEsperado.nome_produto
      const quantidade_esperada = itemEsperado.quantidade

      const leituraCorrespondente = leituras.find(l => 
        l.codigo === produto_codigo || 
        l.produto_nome === produto_nome
      )

      const quantidade_recebida = leituraCorrespondente?.quantidade || 0

      if (quantidade_esperada !== quantidade_recebida) {
        divergenciasCalculadas.push({
          produto: produto_nome,
          quantidade_esperada,
          quantidade_recebida,
          motivo: quantidade_recebida < quantidade_esperada 
            ? `Quantidade inferior ao esperado (falta: ${quantidade_esperada - quantidade_recebida})` 
            : `Quantidade superior ao esperado (excesso: ${quantidade_recebida - quantidade_esperada})`,
          acao_tomada: 'Registrado automaticamente via código de barras'
        })
      }
    })

    // Verificar itens lidos que não estavam na entrada
    leituras.forEach((leitura) => {
      const itemEsperado = selectedEntrada.entrada_itens?.find((item: any) => 
        item.produtos?.codigo === leitura.codigo ||
        (item.produtos?.nome || item.nome_produto) === leitura.produto_nome
      )

      if (!itemEsperado && !leitura.produto_nome.includes('não encontrado')) {
        divergenciasCalculadas.push({
          produto: leitura.produto_nome,
          quantidade_esperada: 0,
          quantidade_recebida: leitura.quantidade,
          motivo: 'Produto recebido não estava previsto na entrada',
          acao_tomada: 'Registrado automaticamente via código de barras'
        })
      }
    })

    setDivergencias(divergenciasCalculadas)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      processarLeituraBarra()
    }
  }

  // Auto-processar quando código for detectado (para coletores que não enviam Enter)
  useEffect(() => {
    if (codigoBarras.length >= 8 && modoConferencia) {
      const timer = setTimeout(() => {
        processarLeituraBarra()
      }, 300) // Aguarda 300ms para garantir que o código completo foi lido
      
      return () => clearTimeout(timer)
    }
  }, [codigoBarras, modoConferencia])

  // Helper functions for empty states
  const getEmptyStateIcon = (status: string) => {
    const icons = {
      'aguardando_transporte': Clock,
      'em_transferencia': Truck,
      'aguardando_conferencia': Eye,
      'planejamento': Package
    }
    return icons[status as keyof typeof icons] || Clock
  }

  const getEmptyStateDescription = (status: string) => {
    const descriptions = {
      'aguardando_transporte': 'Não há produtos aguardando transporte no momento. Novos pedidos aparecerão aqui quando criados.',
      'em_transferencia': 'Nenhum produto está em transferência. Os pedidos aparecerão aqui quando estiverem a caminho do depósito.',
      'aguardando_conferencia': 'Não há produtos aguardando conferência. Produtos em transferência aparecerão aqui quando chegarem.',
      'planejamento': 'Não há produtos em planejamento. Produtos conferidos aparecerão aqui para planejamento de pallets.'
    }
    return descriptions[status as keyof typeof descriptions] || 'Não há pedidos neste status no momento.'
  }

  // Agrupar entradas por status
  const entradasPorStatus = (entradas as any[])?.reduce((acc, entrada) => {
    const status = entrada.status_aprovacao
    if (!acc[status]) acc[status] = []
    acc[status].push(entrada)
    return acc
  }, {} as Record<string, any[]>) || {}

  // Renderizar versão mobile ou desktop
  if (isMobile) {
    return <AprovacaoEntradasMobile />
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recebimento</h1>
        <p className="text-muted-foreground">
          Gerencie o recebimento de produtos dos produtores
        </p>
      </div>


      <Tabs defaultValue="aguardando_transporte" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aguardando_transporte" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Aguardando Transporte ({entradasPorStatus.aguardando_transporte?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="em_transferencia" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Em Transferência ({entradasPorStatus.em_transferencia?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="aguardando_conferencia" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aguardando Conferência ({entradasPorStatus.aguardando_conferencia?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="planejamento" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Planejamento ({entradasPorStatus.planejamento?.length || 0})
          </TabsTrigger>
        </TabsList>

        {['aguardando_transporte', 'em_transferencia', 'aguardando_conferencia', 'planejamento'].map((status) => {
          const statusEntradas = entradasPorStatus[status] || []
          return (
            <TabsContent key={status} value={status} className="space-y-4">
              {statusEntradas.length === 0 ? (
                <EmptyState 
                  title="Nenhum pedido de recebimento"
                  description={getEmptyStateDescription(status)}
                />
              ) : (
              <div className="grid gap-4">
                {(statusEntradas as any[]).map((entrada) => (
                  <Card key={entrada.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            NFe {entrada.numero_nfe || 'S/N'}
                            {getStatusBadge(entrada.status_aprovacao)}
                          </CardTitle>
                          <CardDescription>
                            Produtor: {entrada.profiles?.nome} • Fornecedor: {entrada.fornecedores?.nome}
                          </CardDescription>
                        </div>
                         <div className="flex gap-2">
                           {entrada.status_aprovacao === 'aguardando_conferencia' && (
                             <>
                               <Button
                                 onClick={() => handleAction(entrada, 'conferencia_barras')}
                                 size="sm"
                                 variant="outline"
                                 disabled={atualizarStatus.isPending}
                               >
                                 <Scan className="h-4 w-4 mr-2" />
                                 Conferência por Código de Barras
                               </Button>
                               <Button
                                 onClick={() => handleAction(entrada, 'conferencia')}
                                 size="sm"
                                 disabled={atualizarStatus.isPending}
                               >
                                 <Eye className="h-4 w-4 mr-2" />
                                 Conferência Manual
                               </Button>
                             </>
                           )}
                            {entrada.status_aprovacao === 'planejamento' ? (
                              <Button 
                                onClick={() => handleIniciarPlanejamento(entrada)} 
                                className="ml-2"
                                size="sm"
                                disabled={atualizarStatus.isPending}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Iniciar Alocação
                              </Button>
                            ) : (
                              entrada.status_aprovacao !== 'aguardando_conferencia' && getNextStatusLabel(entrada.status_aprovacao) && (
                                <Button
                                  onClick={() => handleAction(entrada, 'status')}
                                  size="sm"
                                  disabled={atualizarStatus.isPending}
                                >
                                  {getNextStatusLabel(entrada.status_aprovacao)}
                                </Button>
                              )
                            )}
                         </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Data de Entrada:</strong> {format(new Date(entrada.data_entrada), 'dd/MM/yyyy')}
                        </div>
                        <div>
                          <strong>Valor Total:</strong> R$ {entrada.valor_total?.toFixed(2) || '0,00'}
                        </div>
                        <div>
                          <strong>Franquia:</strong> {entrada.franquias?.nome || 'N/A'}
                        </div>
                        <div>
                          <strong>Itens:</strong> {entrada.entrada_itens?.length || 0} produto(s)
                        </div>
                      </div>

                      {entrada.entrada_itens?.length > 0 && (
                        <div className="mt-4">
                          <Separator className="mb-4" />
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Valor Unit.</TableHead>
                                <TableHead>Lote</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entrada.entrada_itens.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.produtos?.nome || item.nome_produto}</TableCell>
                                  <TableCell>{item.quantidade} {item.produtos?.unidade_medida}</TableCell>
                                  <TableCell>R$ {item.valor_unitario?.toFixed(2) || '0,00'}</TableCell>
                                  <TableCell>{item.lote || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {entrada.divergencias && entrada.divergencias.length > 0 && (
                        <div className="mt-4">
                          <Separator className="mb-4" />
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <strong className="text-destructive">Divergências Registradas</strong>
                          </div>
                          {entrada.divergencias.map((div: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg bg-destructive/5">
                              <div className="text-sm space-y-1">
                                <div><strong>Produto:</strong> {div.produto}</div>
                                <div><strong>Esperado:</strong> {div.quantidade_esperada} | <strong>Recebido:</strong> {div.quantidade_recebida}</div>
                                <div><strong>Motivo:</strong> {div.motivo}</div>
                                <div><strong>Ação:</strong> {div.acao_tomada}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          )
        })}
      </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'conferencia_barras' 
                ? 'Conferência por Código de Barras' 
                : actionType === 'conferencia' 
                  ? 'Conferência Manual' 
                  : 'Atualizar Status'
              }
            </DialogTitle>
            <DialogDescription>
              {actionType === 'conferencia_barras' 
                ? 'Use o coletor de código de barras para realizar a conferência automaticamente'
                : actionType === 'conferencia' 
                  ? 'Confira os itens recebidos e registre eventuais divergências manualmente'
                  : `Confirmar mudança de status para "${getNextStatusLabel(selectedEntrada?.status_aprovacao || '')}"`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'conferencia_barras' && (
              <div className="space-y-4">
                {/* Interface do coletor de código de barras */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Leitura de Código de Barras</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="codigo-barras">Código de Barras</Label>
                      <Input
                        id="codigo-barras"
                        ref={inputBarrasRef}
                        value={codigoBarras}
                        onChange={(e) => setCodigoBarras(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Posicione o cursor aqui e use o coletor"
                        className="font-mono text-lg"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantidadeBip}
                        onChange={(e) => setQuantidadeBip(Math.max(1, parseInt(e.target.value) || 1))}
                        className="text-center"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={processarLeituraBarra} 
                        disabled={!codigoBarras.trim()}
                        className="w-full"
                        variant="outline"
                      >
                        <Scan className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                   <div className="bg-muted/30 p-3 rounded-lg">
                     <p className="text-sm text-muted-foreground">
                       <strong>Instruções:</strong> O coletor processará automaticamente após cada leitura. 
                       Use o campo "Quantidade" para bipar múltiplas unidades de uma só vez.
                       O planejamento de pallets será feito na etapa específica de planejamento.
                     </p>
                   </div>
                </div>

                {/* Lista de leituras realizadas */}
                {leituras.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Leituras Realizadas ({leituras.length})</Label>
                      <Button 
                        onClick={gerarDivergenciasAutomaticas} 
                        size="sm" 
                        variant="outline"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Gerar Divergências
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leituras.map((leitura, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{leitura.codigo}</TableCell>
                              <TableCell>{leitura.produto_nome}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    onClick={() => diminuirQuantidade(leitura.codigo)}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="mx-2 font-medium">{leitura.quantidade}</span>
                                  <Button
                                    onClick={() => aumentarQuantidade(leitura.codigo)}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                               </TableCell>
                               <TableCell>{format(leitura.timestamp, 'HH:mm:ss')}</TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => removerLeitura(leitura.codigo)}
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Divergências geradas automaticamente */}
                {divergencias.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-destructive">
                      Divergências Detectadas ({divergencias.length})
                    </Label>
                    <div className="space-y-2">
                      {divergencias.map((div, index) => (
                        <Card key={index} className="bg-destructive/5">
                          <CardContent className="p-3">
                            <div className="text-sm space-y-1">
                              <div><strong>Produto:</strong> {div.produto}</div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><strong>Esperado:</strong> {div.quantidade_esperada}</div>
                                <div><strong>Recebido:</strong> {div.quantidade_recebida}</div>
                              </div>
                              <div><strong>Motivo:</strong> {div.motivo}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {actionType === 'conferencia' && (
              <div className="space-y-4">
                {/* Lista de itens para seleção rápida */}
                {selectedEntrada?.entrada_itens?.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Itens da Entrada</Label>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Lote</TableHead>
                              <TableHead>Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                           {selectedEntrada.entrada_itens.map((item: any) => (
                             <TableRow key={item.id}>
                               <TableCell>{item.produtos?.nome || item.nome_produto}</TableCell>
                               <TableCell>{item.quantidade} {item.produtos?.unidade_medida}</TableCell>
                                <TableCell>{item.lote || '-'}</TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() => addDivergencia(item)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Registrar Divergência
                                  </Button>
                                </TableCell>
                             </TableRow>
                           ))}
                        </TableBody>
                      </Table>
                    </div>
                   </div>
                 ) : (
                   <div className="border rounded-lg p-4 bg-muted/30">
                     <div className="text-center text-muted-foreground">
                       <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                       <p className="font-medium">Nenhum item encontrado nesta entrada</p>
                       <p className="text-sm">Verifique se a entrada possui itens cadastrados.</p>
                       {selectedEntrada && (
                         <div className="mt-2 text-xs">
                           <p>ID da entrada: {selectedEntrada.id}</p>
                           <p>Status: {selectedEntrada.status_aprovacao}</p>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                <div className="flex items-center">
                  <Label className="text-base font-semibold">Divergências</Label>
                  <Button
                    onClick={() => addDivergencia()}
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Divergência
                  </Button>
                </div>

                {divergencias.map((div, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Divergência {index + 1}</Label>
                        <Button
                          onClick={() => removeDivergencia(index)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Produto</Label>
                          <Input
                            value={div.produto}
                            onChange={(e) => updateDivergencia(index, 'produto', e.target.value)}
                            placeholder="Nome do produto"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Qtd. Esperada</Label>
                            <Input
                              type="number"
                              value={div.quantidade_esperada}
                              onChange={(e) => updateDivergencia(index, 'quantidade_esperada', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Qtd. Recebida</Label>
                            <Input
                              type="number"
                              value={div.quantidade_recebida}
                              onChange={(e) => updateDivergencia(index, 'quantidade_recebida', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Motivo da Divergência</Label>
                        <Textarea
                          value={div.motivo}
                          onChange={(e) => updateDivergencia(index, 'motivo', e.target.value)}
                          placeholder="Descreva o motivo da divergência"
                        />
                      </div>
                      
                      <div>
                        <Label>Ação Tomada</Label>
                        <Textarea
                          value={div.acao_tomada}
                          onChange={(e) => updateDivergencia(index, 'acao_tomada', e.target.value)}
                          placeholder="Descreva a ação tomada"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta etapa (opcional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={atualizarStatus.isPending}>
              {atualizarStatus.isPending ? 'Atualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Planejamento de Pallets */}
      <Dialog open={planejamentoModalOpen} onOpenChange={setPlanejamentoModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Planejamento de Pallets - NFe {selectedEntradaPlanejamento?.numero_nfe || 'S/N'}
            </DialogTitle>
            <DialogDescription>
              Monte os pallets com os produtos desta entrada. Organize os produtos de acordo com suas necessidades de armazenamento.
            </DialogDescription>
          </DialogHeader>

          {selectedEntradaPlanejamento && (
            <div className="space-y-6">
              {/* Informações da entrada */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <strong>Produtor:</strong> {selectedEntradaPlanejamento.profiles?.nome}
                </div>
                <div>
                  <strong>Fornecedor:</strong> {selectedEntradaPlanejamento.fornecedores?.nome}
                </div>
                <div>
                  <strong>Data:</strong> {format(new Date(selectedEntradaPlanejamento.data_entrada), 'dd/MM/yyyy')}
                </div>
                <div>
                  <strong>Valor Total:</strong> R$ {selectedEntradaPlanejamento.valor_total?.toFixed(2) || '0,00'}
                </div>
              </div>

              {/* Componente de planejamento */}
              <PlanejamentoPallets 
                entradaId={selectedEntradaPlanejamento.id}
                entradaItens={selectedEntradaPlanejamento.entrada_itens || []}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanejamentoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinalizarPlanejamento} disabled={atualizarStatus.isPending}>
              {atualizarStatus.isPending ? 'Finalizando...' : 'Finalizar Planejamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}