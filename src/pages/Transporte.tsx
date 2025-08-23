import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusIndicator } from "@/components/Rastreio/StatusIndicator"
import { useSaidasPendentes, useAtualizarStatusSaida } from "@/hooks/useSaidasPendentes"
import { formatDate } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Truck, Package } from "lucide-react"

export default function Transporte() {
  const [expandedSaida, setExpandedSaida] = useState<string | null>(null)
  
  const { data: saidasData, isLoading } = useSaidasPendentes()
  
  // Filter only expedido status
  const saidas = saidasData?.filter(saida => saida.status === 'expedido') || []
  
  const { mutate: atualizarStatus, isPending } = useAtualizarStatusSaida()

  const handleStatusUpdate = (saidaId: string, status: string) => {
    atualizarStatus({ 
      saidaId, 
      status,
      observacoes: "Entrega confirmada via sistema de transporte"
    })
  }

  const toggleExpansion = (saidaId: string) => {
    setExpandedSaida(expandedSaida === saidaId ? null : saidaId)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Transporte</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!saidas || saidas.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Transporte</h1>
        </div>
        <EmptyState
          icon={<Package className="h-12 w-12 text-muted-foreground" />}
          title="Nenhuma saída expedida"
          description="Não há saídas expedidas aguardando entrega no momento."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Transporte</h1>
        </div>
        <Badge variant="secondary" className="text-sm">
          {saidas.length} saída{saidas.length !== 1 ? 's' : ''} expedida{saidas.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {saidas.map((saida) => (
          <Card key={saida.id} className="shadow-card">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleExpansion(saida.id)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    Saída #{saida.id.slice(0, 8)}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Criada em: {formatDate(new Date(saida.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    <span>Produtor: {(saida as any).produtor?.nome || "Não identificado"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIndicator 
                    status={saida.status} 
                    type="saida" 
                  />
                  <span className="text-xs text-muted-foreground">
                    {saida.saida_itens?.length || 0} iten{(saida.saida_itens?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardHeader>

            {expandedSaida === saida.id && (
              <CardContent className="space-y-4">
                {/* Informações da Saída */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Data da Saída:</span>
                    <p>{formatDate(new Date(saida.data_saida), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Depósito:</span>
                    <p>Depósito #{saida.deposito_id?.slice(0, 8) || "Não identificado"}</p>
                  </div>
                  {saida.observacoes && (
                    <div>
                      <span className="font-medium text-muted-foreground">Observações:</span>
                      <p>{saida.observacoes}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Itens da Saída */}
                <div>
                  <h4 className="font-medium mb-3">Itens da Saída</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saida.saida_itens?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.produtos?.nome || "Produto não identificado"}
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

                <Separator />

                {/* Ações */}
                <div className="flex items-center justify-end">
                  <Button
                    onClick={() => handleStatusUpdate(saida.id, 'entregue')}
                    disabled={isPending}
                    className="bg-gradient-primary hover:bg-primary/90"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Confirmar Entrega
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}