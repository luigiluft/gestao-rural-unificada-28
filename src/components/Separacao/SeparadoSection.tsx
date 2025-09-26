import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Scan, Send } from "lucide-react"
import { format } from "date-fns"
import { ItemSeparacaoCard } from "./ItemSeparacaoCard"
import { useExpedirSaida } from "@/hooks/useExpedirSaida"

interface SeparadoSectionProps {
  saidas: any[]
  formatCurrency: (value: number | null) => string
}

export function SeparadoSection({ saidas, formatCurrency }: SeparadoSectionProps) {
  const [selectedSaida, setSelectedSaida] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const expedirSaida = useExpedirSaida()

  const handleExpedir = (saida: any) => {
    setSelectedSaida(saida)
    setObservacoes('')
    setDialogOpen(true)
  }

  const handleConfirmExpedicao = async () => {
    if (!selectedSaida) return

    await expedirSaida.mutateAsync({
      saidaId: selectedSaida.id,
      observacoes
    })
    
    setDialogOpen(false)
    setSelectedSaida(null)
    setObservacoes('')
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Scan className="h-3 w-3" />
        Separado
      </Badge>
    )
  }

  if (saidas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum produto separado aguardando expedição</p>
      </div>
    )
  }

  return (
    <>
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
                <Button
                  onClick={() => handleExpedir(saida)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Expedir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Confirmação de Expedição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Expedição</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja expedir a saída {selectedSaida?.id.slice(-6).toUpperCase()}?
              Esta ação criará automaticamente uma remessa pronta para planejamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Digite observações sobre a expedição..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmExpedicao}
              disabled={expedirSaida.isPending}
            >
              {expedirSaida.isPending ? "Expedindo..." : "Confirmar Expedição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}