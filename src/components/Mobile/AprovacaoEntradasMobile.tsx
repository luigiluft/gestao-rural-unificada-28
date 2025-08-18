import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, Truck, Eye, AlertTriangle, Plus, Trash2, Scan, Calculator, X, Menu, MoreVertical } from "lucide-react"
import { useEntradasPendentes, useAtualizarStatusEntrada } from "@/hooks/useEntradasPendentes"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function AprovacaoEntradasMobile() {
  const { data: entradas, isLoading } = useEntradasPendentes()
  const atualizarStatus = useAtualizarStatusEntrada()
  
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'status' | 'conferencia' | 'conferencia_barras'>('status')
  const [observacoes, setObservacoes] = useState('')
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])
  
  // Estados para conferência por código de barras
  const [codigoBarras, setCodigoBarras] = useState('')
  const [quantidadeBip, setQuantidadeBip] = useState(1)
  const [leituras, setLeituras] = useState<LeituraBarra[]>([])
  const [modoConferencia, setModoConferencia] = useState(false)
  const inputBarrasRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = "Aprovação de Entradas - Sistema de Gestão"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie e aprove entradas de produtos no sistema de gestão de estoque')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const, icon: Clock },
      'em_transferencia': { label: 'Em Transferência', variant: 'default' as const, icon: Truck },
      'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const, icon: Eye },
      'conferencia_completa': { label: 'Conferência Completa', variant: 'default' as const, icon: CheckCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        <span className="hidden sm:inline">{config.label}</span>
      </Badge>
    )
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'aguardando_transporte': 'em_transferencia',
      'em_transferencia': 'aguardando_conferencia',
      'aguardando_conferencia': 'conferencia_completa',
      'conferencia_completa': 'confirmado'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      'aguardando_transporte': 'Em Transferência',
      'em_transferencia': 'Aguardando Conferência',
      'aguardando_conferencia': 'Realizar Conferência',
      'conferencia_completa': 'Confirmar'
    }
    return statusLabels[currentStatus as keyof typeof statusLabels] || null
  }

  const handleAction = (entrada: any, type: 'status' | 'conferencia' | 'conferencia_barras') => {
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
      const novaLeitura: LeituraBarra = {
        codigo: codigoBarras.trim(),
        produto_nome: `Produto não encontrado (${codigoBarras.trim()})`,
        quantidade: quantidadeBip,
        timestamp: new Date()
      }
      setLeituras([...leituras, novaLeitura])
    } else {
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
            ? `Falta: ${quantidade_esperada - quantidade_recebida}` 
            : `Excesso: ${quantidade_recebida - quantidade_esperada}`,
          acao_tomada: 'Via código de barras'
        })
      }
    })

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
          motivo: 'Produto não previsto',
          acao_tomada: 'Via código de barras'
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

  useEffect(() => {
    if (codigoBarras.length >= 8 && modoConferencia) {
      const timer = setTimeout(() => {
        processarLeituraBarra()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [codigoBarras, modoConferencia])

  // Agrupar entradas por status
  const entradasPorStatus = (entradas as any[])?.reduce((acc, entrada) => {
    const status = entrada.status_aprovacao
    if (!acc[status]) acc[status] = []
    acc[status].push(entrada)
    return acc
  }, {} as Record<string, any[]>) || {}

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Aprovação de Entradas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie o fluxo de aprovação das entradas
        </p>
      </div>

      <Tabs defaultValue="aguardando_transporte" className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-9 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
            <TabsTrigger value="aguardando_transporte" className="text-xs px-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Transporte ({entradasPorStatus.aguardando_transporte?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="em_transferencia" className="text-xs px-3 flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>Transferência ({entradasPorStatus.em_transferencia?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="aguardando_conferencia" className="text-xs px-3 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Conferência ({entradasPorStatus.aguardando_conferencia?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="conferencia_completa" className="text-xs px-3 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Completa ({entradasPorStatus.conferencia_completa?.length || 0})</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {Object.entries(entradasPorStatus).map(([status, statusEntradas]) => (
          <TabsContent key={status} value={status} className="space-y-3">
            {(statusEntradas as any[]).length === 0 ? (
              <EmptyState 
                title="Nenhuma entrada"
                description={`Não há entradas neste status.`}
              />
            ) : (
              <div className="space-y-3">
                {(statusEntradas as any[]).map((entrada) => (
                  <Card key={entrada.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            <span>NFe {entrada.numero_nfe || 'S/N'}</span>
                            {getStatusBadge(entrada.status_aprovacao)}
                          </CardTitle>
                          <CardDescription className="text-xs space-y-1">
                            <div><strong>Produtor:</strong> {entrada.profiles?.nome}</div>
                            <div><strong>Fornecedor:</strong> {entrada.fornecedores?.nome}</div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <strong>Data:</strong> {format(new Date(entrada.data_entrada), 'dd/MM/yy')}
                          </div>
                          <div>
                            <strong>Valor:</strong> R$ {entrada.valor_total?.toFixed(2) || '0,00'}
                          </div>
                          <div className="col-span-2">
                            <strong>Franquia:</strong> {entrada.franquias?.nome || 'N/A'}
                          </div>
                          <div>
                            <strong>Itens:</strong> {entrada.entrada_itens?.length || 0}
                          </div>
                        </div>
                        
                        {/* Ações com menu dropdown */}
                        <div className="pt-3 border-t">
                          {entrada.status_aprovacao === 'aguardando_conferencia' ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleAction(entrada, 'conferencia_barras')}
                                size="sm"
                                className="flex-1"
                                disabled={atualizarStatus.isPending}
                              >
                                <Scan className="h-4 w-4 mr-2" />
                                Código Barras
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="px-3"
                                    disabled={atualizarStatus.isPending}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => handleAction(entrada, 'conferencia')}
                                    disabled={atualizarStatus.isPending}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Conferência Manual
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : (
                            getNextStatusLabel(entrada.status_aprovacao) && (
                              <Button
                                onClick={() => handleAction(entrada, 'status')}
                                size="sm"
                                className="w-full"
                                disabled={atualizarStatus.isPending}
                              >
                                {getNextStatusLabel(entrada.status_aprovacao)}
                              </Button>
                            )
                          )}
                        </div>

                        {/* Divergências registradas */}
                        {entrada.divergencias && entrada.divergencias.length > 0 && (
                          <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong className="text-sm text-destructive">
                                {entrada.divergencias.length} Divergência(s) Registrada(s)
                              </strong>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Clique para ver detalhes das divergências encontradas.
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog Mobile Otimizado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">
              {actionType === 'conferencia_barras' 
                ? 'Código de Barras' 
                : actionType === 'conferencia' 
                  ? 'Conferência Manual' 
                  : 'Atualizar Status'
              }
            </DialogTitle>
            <DialogDescription className="text-sm">
              {actionType === 'conferencia_barras' 
                ? 'Use o coletor para conferência automática'
                : actionType === 'conferencia' 
                  ? 'Registre divergências manualmente'
                  : 'Confirmar mudança de status'
              }
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-4">
              {actionType === 'conferencia_barras' && (
                <div className="space-y-4">
                  {/* Interface do coletor - Mobile */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Leitura de Código</Label>
                    
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="codigo-barras" className="text-sm">Código de Barras</Label>
                        <Input
                          id="codigo-barras"
                          ref={inputBarrasRef}
                          value={codigoBarras}
                          onChange={(e) => setCodigoBarras(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Use o coletor aqui"
                          className="font-mono text-base h-12"
                          autoFocus
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="quantidade" className="text-sm">Qtd</Label>
                          <Input
                            id="quantidade"
                            type="number"
                            min="1"
                            value={quantidadeBip}
                            onChange={(e) => setQuantidadeBip(Math.max(1, parseInt(e.target.value) || 1))}
                            className="text-center h-12"
                          />
                        </div>
                        <div className="col-span-2 flex items-end">
                          <Button 
                            onClick={processarLeituraBarra} 
                            disabled={!codigoBarras.trim()}
                            className="w-full h-12"
                          >
                            <Scan className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded text-xs text-muted-foreground">
                      <strong>Dica:</strong> O sistema processa automaticamente. 
                      Ajuste a quantidade antes de bipar.
                    </div>
                  </div>

                  {/* Lista de leituras - Mobile */}
                  {leituras.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          Leituras ({leituras.length})
                        </Label>
                        <Button 
                          onClick={gerarDivergenciasAutomaticas} 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Calcular
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {leituras.map((leitura, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="font-mono text-sm">{leitura.codigo}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {leitura.produto_nome}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(leitura.timestamp, 'HH:mm:ss')}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => removerLeitura(leitura.codigo)}
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive p-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => diminuirQuantidade(leitura.codigo)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="mx-4 font-semibold text-lg min-w-[2rem] text-center">
                                  {leitura.quantidade}
                                </span>
                                <Button
                                  onClick={() => aumentarQuantidade(leitura.codigo)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divergências - Mobile */}
                  {divergencias.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-destructive">
                        Divergências ({divergencias.length})
                      </Label>
                      <div className="space-y-2">
                        {divergencias.map((div, index) => (
                          <Card key={index} className="bg-destructive/5 border-destructive/20 p-3">
                            <div className="text-sm space-y-1">
                              <div><strong>Produto:</strong> {div.produto}</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><strong>Esperado:</strong> {div.quantidade_esperada}</div>
                                <div><strong>Recebido:</strong> {div.quantidade_recebida}</div>
                              </div>
                              <div><strong>Motivo:</strong> {div.motivo}</div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {actionType === 'conferencia' && (
                <div className="space-y-4">
                  {/* Conferência manual mobile-friendly */}
                  {selectedEntrada?.entrada_itens?.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Itens da Entrada</Label>
                      <div className="space-y-2">
                        {selectedEntrada.entrada_itens.map((item: any) => (
                          <Card key={item.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">
                                  {item.produtos?.nome || item.nome_produto}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Qtd: {item.quantidade} {item.produtos?.unidade_medida}
                                </div>
                                {item.lote && (
                                  <div className="text-xs text-muted-foreground">
                                    Lote: {item.lote}
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={() => addDivergencia(item)}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Divergência
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Divergências</Label>
                    <Button onClick={() => addDivergencia()} size="sm" variant="outline" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {divergencias.map((div, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-sm">Divergência {index + 1}</Label>
                          <Button
                            onClick={() => removeDivergencia(index)}
                            size="sm"
                            variant="outline"
                            className="text-destructive p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Produto</Label>
                            <Input
                              value={div.produto}
                              onChange={(e) => updateDivergencia(index, 'produto', e.target.value)}
                              placeholder="Nome do produto"
                              className="h-10"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Qtd. Esperada</Label>
                              <Input
                                type="number"
                                value={div.quantidade_esperada}
                                onChange={(e) => updateDivergencia(index, 'quantidade_esperada', parseFloat(e.target.value) || 0)}
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Qtd. Recebida</Label>
                              <Input
                                type="number"
                                value={div.quantidade_recebida}
                                onChange={(e) => updateDivergencia(index, 'quantidade_recebida', parseFloat(e.target.value) || 0)}
                                className="h-10"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Motivo da Divergência</Label>
                            <Textarea
                              value={div.motivo}
                              onChange={(e) => updateDivergencia(index, 'motivo', e.target.value)}
                              placeholder="Descreva o motivo"
                              className="resize-none"
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs">Ação Tomada</Label>
                            <Textarea
                              value={div.acao_tomada}
                              onChange={(e) => updateDivergencia(index, 'acao_tomada', e.target.value)}
                              placeholder="Descreva a ação"
                              className="resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-sm">Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={atualizarStatus.isPending}
              className="flex-1"
            >
              {atualizarStatus.isPending ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}