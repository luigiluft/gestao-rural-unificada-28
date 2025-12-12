import { useState } from "react"
import { useEmbarques, useDeleteEmbarque, type Embarque } from "@/hooks/useEmbarques"
import { useClienteCapacidadesTransporte } from "@/hooks/useClienteCapacidadesTransporte"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/ui/loading-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Package, Plus, Trash2, Eye, MapPin, Building2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import NovoEmbarqueDialog from "@/components/Embarques/NovoEmbarqueDialog"

const statusConfig: Record<Embarque['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aguardando_frete: { label: "Aguardando Frete", variant: "outline" },
  em_roteirizacao: { label: "Em Roteirização", variant: "default" },
  em_transito: { label: "Em Trânsito", variant: "default" },
  entregue: { label: "Entregue", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
}

export default function Embarques() {
  const { data: embarques, isLoading, error } = useEmbarques()
  const { data: capacidades } = useClienteCapacidadesTransporte()
  const deleteEmbarque = useDeleteEmbarque()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (isLoading) {
    return <LoadingState text="Carregando embarques..." variant="spinner" fullHeight />
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar embarques: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Embarques</h1>
          <p className="text-muted-foreground">Gerencie seus embarques de mercadorias</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Embarque
        </Button>
      </div>

      {/* Info sobre capacidades */}
      {capacidades && (
        <div className="flex gap-2 flex-wrap">
          {capacidades.has_own_fleet && (
            <Badge variant="outline" className="gap-1">
              <Building2 className="h-3 w-3" />
              Frota Própria
            </Badge>
          )}
          {capacidades.can_aggregate && (
            <Badge variant="outline" className="gap-1">
              Agregados Habilitados
            </Badge>
          )}
          {capacidades.can_collect && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              Coletas Habilitadas
            </Badge>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Embarques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!embarques?.length ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Nenhum embarque encontrado"
              description="Crie seu primeiro embarque para começar a gerenciar suas operações de transporte."
              action={{
                label: "Criar Embarque",
                onClick: () => setDialogOpen(true),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destinos</TableHead>
                  <TableHead>Volumes</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {embarques.map((embarque) => {
                  const status = statusConfig[embarque.status]
                  return (
                    <TableRow key={embarque.id}>
                      <TableCell className="font-medium">{embarque.numero}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {embarque.tipo_origem === 'COLETA' ? (
                            <>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">Coleta</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {embarque.origem_deposito?.nome || "Base própria"}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {embarque.destinos?.length || 0} destino(s)
                      </TableCell>
                      <TableCell>{embarque.quantidade_volumes || "-"}</TableCell>
                      <TableCell>
                        {embarque.peso_total ? `${embarque.peso_total.toFixed(2)} kg` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(embarque.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir embarque?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O embarque {embarque.numero} será permanentemente excluído.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEmbarque.mutate(embarque.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NovoEmbarqueDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        canCollect={capacidades?.can_collect ?? false}
      />
    </div>
  )
}
