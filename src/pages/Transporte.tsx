import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter"
import { useSaidasPendentes, useAtualizarStatusSaida } from "@/hooks/useSaidasPendentes"
import { format } from "date-fns"
import { Truck, CheckCircle } from "lucide-react"

export default function Transporte() {
  const { data: saidasData, isLoading } = useSaidasPendentes()
  const atualizarStatus = useAtualizarStatusSaida()
  
  const [selectedSaida, setSelectedSaida] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')

  // Filter only entregue status for transport confirmation
  const saidas = saidasData?.filter(saida => saida.status === 'entregue') || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
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
      'entregue': 'finalizado'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      'entregue': 'Finalizar Entrega'
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
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
        <h1 className="text-3xl font-bold text-foreground">Transporte</h1>
        <p className="text-muted-foreground">
          Confirme as entregas que já foram realizadas e finalize o processo de transporte
        </p>
      </div>


      {/* Content */}
      <div className="space-y-4">
        {saidas.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-12 w-12 text-muted-foreground" />}
            title="Nenhuma entrega pendente"
            description="Não há entregas confirmadas aguardando finalização. Produtos aparecerão aqui após serem entregues."
          />
        ) : (
          <div className="grid gap-4">
            {saidas.map((saida) => (
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
                      <p className="font-medium">Entrega de Produtos</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">PRODUTOR</Label>
                      <p className="font-medium">{(saida as any).produtor?.nome || "Não identificado"}</p>
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
                          <Truck className="h-4 w-4 mr-2" />
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
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Entrega</DialogTitle>
            <DialogDescription>
              {selectedSaida && `Deseja finalizar o processo de entrega da saída SAI${selectedSaida.id.slice(-6).toUpperCase()}?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações da Finalização (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a finalização da entrega..."
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
              {atualizarStatus.isPending ? "Finalizando..." : "Finalizar Entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}