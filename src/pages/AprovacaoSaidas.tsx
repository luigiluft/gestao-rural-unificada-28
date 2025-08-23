import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Package, CheckCircle } from "lucide-react"
import { useSaidasPendentes, useAtualizarStatusSaida } from "@/hooks/useSaidasPendentes"
import { format } from "date-fns"
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter"

export default function AprovacaoSaidas() {
  // Set up default date range (last 30 days)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const hoje = new Date()
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(hoje.getDate() - 30)
    return { from: trintaDiasAtras, to: hoje }
  })
  
  const { data: saidas, isLoading } = useSaidasPendentes(dateRange)
  const atualizarStatus = useAtualizarStatusSaida()
  
  const [selectedSaida, setSelectedSaida] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    document.title = "Expedição - AgroHub"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie a expedição de produtos no AgroHub')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'separado': { label: 'Separado', variant: 'default' as const, icon: Package },
      'expedido': { label: 'Expedido', variant: 'outline' as const, icon: Truck },
      'entregue': { label: 'Entregue', variant: 'default' as const, icon: CheckCircle },
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
      'separado': 'expedido',
      'expedido': 'entregue'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      'separado': 'Marcar como Expedido',  
      'expedido': 'Marcar como Entregue'
    }
    return statusLabels[currentStatus as keyof typeof statusLabels] || null
  }

  const handleAction = (saida: any) => {
    setSelectedSaida(saida)
    setObservacoes('')
    setDialogOpen(true)
  }


  const handleConfirm = async () => {
    if (!selectedSaida) return

    const nextStatus = getNextStatus(selectedSaida.status)
    if (!nextStatus) return

    await atualizarStatus.mutateAsync({
      saidaId: selectedSaida.id,
      status: nextStatus,
      observacoes
    })
    
    setDialogOpen(false)
    setSelectedSaida(null)
    setObservacoes('')
  }

  // Helper functions for empty states
  const getEmptyStateDescription = (status: string) => {
    const descriptions = {
      'separado': 'Nenhum produto está separado e pronto para expedição. Produtos aparecerão aqui após serem separados.',
      'expedido': 'Não há produtos expedidos recentemente. Produtos expedidos aparecerão aqui após saírem do depósito.',
      'entregue': 'Não há produtos entregues recentemente. Produtos aparecerão aqui após serem entregues.'
    }
    return descriptions[status as keyof typeof descriptions] || 'Não há pedidos neste status no momento.'
  }

  // Filtrar saídas por status (apenas expedição: separado, expedido, entregue)
  const saidasPorStatus = {
    separado: saidas?.filter(s => s.status === 'separado') || [],
    expedido: saidas?.filter(s => s.status === 'expedido') || [],
    entregue: saidas?.filter(s => s.status === 'entregue') || []
  }

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Expedição</h1>
        <p className="text-muted-foreground">
          Gerencie o processo de expedição e entrega dos produtos separados
        </p>
      </div>

      {/* Date Filter */}
      <DateRangeFilter 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />


      {/* Tabs por Status */}
      <Tabs defaultValue="separado" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="separado" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Separado ({saidasPorStatus.separado.length})
          </TabsTrigger>
          <TabsTrigger value="expedido" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Expedido ({saidasPorStatus.expedido.length})
          </TabsTrigger>
          <TabsTrigger value="entregue" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Entregue ({saidasPorStatus.entregue.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(saidasPorStatus).map(([status, saidasStatus]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {saidasStatus.length === 0 ? (
              <EmptyState
                title="Nenhum pedido de expedição"
                description={getEmptyStateDescription(status)}
              />
            ) : (
              <div className="grid gap-4">
                {saidasStatus.map((saida) => (
                  <Card key={saida.id} className="shadow-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-lg">
                            SAI{saida.id.slice(-6).toUpperCase()}
                          </div>
                          {getStatusBadge(saida.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(saida.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Informações da Saída */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">DESTINATÁRIO</Label>
                          <p className="font-medium">Saída de Produtos</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">TIPO DE SAÍDA</Label>
                          <p className="font-medium">{saida.tipo_saida || "Não informado"}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">DATA DA SAÍDA</Label>
                          <p className="font-medium">{format(new Date(saida.data_saida), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Itens da Saída */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Itens da Saída</Label>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Lote</TableHead>
                              <TableHead className="text-right">Quantidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {saida.saida_itens?.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {item.produtos?.nome || "Nome não disponível"}
                                </TableCell>
                                <TableCell>{item.lote || "-"}</TableCell>
                                <TableCell className="text-right">
                                  {item.quantidade} {item.produtos?.unidade_medida || "un"}
                                </TableCell>
                              </TableRow>
                            ))} 
                          </TableBody>
                        </Table>
                      </div>

                      {/* Observações */}
                      {saida.observacoes && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <Label className="text-xs font-medium text-muted-foreground">OBSERVAÇÕES</Label>
                          <p className="text-sm mt-1">{saida.observacoes}</p>
                        </div>
                      )}

                      <Separator />

                      {/* Ações */}
                      <div className="flex items-center justify-end">
                        <div className="flex gap-2">
                          {getNextStatusLabel(saida.status) && (
                            <Button
                              onClick={() => handleAction(saida)}
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                            >
                              {getNextStatusLabel(saida.status)}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog de Confirmação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Atualização de Status</DialogTitle>
            <DialogDescription>
              {selectedSaida && `Deseja atualizar o status da saída SAI${selectedSaida.id.slice(-6).toUpperCase()} para "${getNextStatusLabel(selectedSaida.status)?.replace('Marcar como ', '')}"?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta atualização..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={atualizarStatus.isPending}
            >
              {atualizarStatus.isPending ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}