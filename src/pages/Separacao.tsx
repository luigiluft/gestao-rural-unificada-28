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
import { Clock, Scan, AlertTriangle } from "lucide-react"
import { useSaidasPendentes, useAtualizarStatusSaida } from "@/hooks/useSaidasPendentes"
import { SeparacaoIndividual } from "@/components/Saidas/SeparacaoIndividual"
import { format } from "date-fns"
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter"
import { ItemSeparacaoCard } from "@/components/Separacao/ItemSeparacaoCard"

export default function Separacao() {
  const { data: saidas, isLoading } = useSaidasPendentes()
  const atualizarStatus = useAtualizarStatusSaida()
  
  const [selectedSaida, setSelectedSaida] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [separacaoOpen, setSeparacaoOpen] = useState(false)

  useEffect(() => {
    document.title = "Separação - AgroHub"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie a separação de produtos no AgroHub')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'separacao_pendente': { label: 'Separação Pendente', variant: 'secondary' as const, icon: Clock },
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

  const handleAction = (saida: any) => {
    setSelectedSaida(saida)
    setObservacoes('')
    setDialogOpen(true)
  }

  const handleSeparacaoIndividual = (saida: any) => {
    setSelectedSaida(saida)
    setSeparacaoOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedSaida) return

    await atualizarStatus.mutateAsync({
      saidaId: selectedSaida.id,
      status: 'separado',
      observacoes
    })
    
    setDialogOpen(false)
    setSelectedSaida(null)
    setObservacoes('')
  }

  // Helper functions for empty states
  const getEmptyStateDescription = (status: string) => {
    const descriptions = {
      'separacao_pendente': 'Não há produtos aguardando separação no momento. Novos pedidos de saída aparecerão aqui quando criados.',
      'separado': 'Nenhum produto está separado no momento. Produtos aparecerão aqui após serem separados.',
    }
    return descriptions[status as keyof typeof descriptions] || 'Não há pedidos neste status no momento.'
  }

  // Filtrar saídas apenas para separação pendente
  const saidasPorStatus = {
    separacao_pendente: saidas?.filter(s => s.status === 'separacao_pendente') || []
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
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
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
        <h1 className="text-3xl font-bold text-foreground">Separação</h1>
        <p className="text-muted-foreground">
          Gerencie o processo de separação de produtos para expedição
        </p>
      </div>



      {/* Conteúdo da Separação Pendente */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Separação Pendente ({saidasPorStatus.separacao_pendente.length})</h2>
        </div>

        {saidasPorStatus.separacao_pendente.length === 0 ? (
          <EmptyState
            title="Nenhum pedido para separação"
            description={getEmptyStateDescription('separacao_pendente')}
          />
        ) : (
          <div className="grid gap-4">
            {saidasPorStatus.separacao_pendente.map((saida) => (
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
                            <TableCell>
                              <ItemSeparacaoCard 
                                item={item} 
                                depositoId={saida.deposito_id}
                                formatCurrency={formatCurrency}
                              />
                            </TableCell>
                            <TableCell>{item.lote || "Não informado"}</TableCell>
                            <TableCell className="text-right">
                              {item.quantidade} {item.produtos?.unidade_medida}
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
                  <div className="flex justify-end">
                    <div className="flex gap-2">
                      {saida.status === 'separacao_pendente' && (
                        <Button
                          onClick={() => handleSeparacaoIndividual(saida)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        >
                          <Scan className="h-4 w-4" />
                          Separação Individual
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


      {/* Dialog de Separação Individual */}
      <SeparacaoIndividual
        saida={selectedSaida}
        open={separacaoOpen}
        onClose={() => {
          setSeparacaoOpen(false)
          setSelectedSaida(null)
        }}
      />
    </div>
  )
}