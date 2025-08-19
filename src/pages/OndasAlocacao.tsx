import { useState } from "react"
import { useAllocationWaves, useStartAllocationWave } from "@/hooks/useAllocationWaves"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Package, Play, Clock, CheckCircle, User, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function OndasAlocacao() {
  const { data: waves, isLoading } = useAllocationWaves()
  const startWave = useStartAllocationWave()
  const [selectedWave, setSelectedWave] = useState<any>(null)
  const [funcionarioId, setFuncionarioId] = useState<string>("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'em_andamento':
        return <Badge variant="outline"><Play className="w-3 h-3 mr-1" />Em Andamento</Badge>
      case 'concluida':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleStartWave = async () => {
    if (selectedWave) {
      await startWave.mutateAsync({ 
        waveId: selectedWave.id,
        funcionarioId: funcionarioId || undefined
      })
      setSelectedWave(null)
      setFuncionarioId("")
    }
  }

  const getTotalItems = (wave: any) => {
    return wave.allocation_wave_items?.length || 0
  }

  const getItemsAlocados = (wave: any) => {
    return wave.allocation_wave_items?.filter((item: any) => item.status === 'alocado').length || 0
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!waves || waves.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Ondas de Alocação</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as ondas de alocação de produtos no estoque
          </p>
        </div>
        
        <EmptyState
          icon={Package}
          title="Nenhuma onda de alocação encontrada"
          description="As ondas de alocação são criadas automaticamente quando entradas são confirmadas."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ondas de Alocação</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as ondas de alocação de produtos no estoque
        </p>
      </div>

      <div className="grid gap-6">
        {waves.map((wave: any) => (
          <Card key={wave.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {wave.numero_onda}
                  </CardTitle>
                  <CardDescription>
                    {wave.franquias?.nome} • {getTotalItems(wave)} itens
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(wave.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Criada em:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(wave.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {wave.data_inicio && (
                    <div>
                      <span className="font-medium">Iniciada em:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(wave.data_inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {wave.funcionario_id && (
                    <div>
                      <span className="font-medium">Funcionário:</span>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Atribuído
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Progresso:</span>
                    <p className="text-muted-foreground">
                      {getItemsAlocados(wave)} / {getTotalItems(wave)} itens
                    </p>
                  </div>
                </div>

                {wave.observacoes && (
                  <div>
                    <span className="font-medium text-sm">Observações:</span>
                    <p className="text-sm text-muted-foreground mt-1">{wave.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {wave.status === 'pendente' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedWave(wave)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Iniciar Alocação
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Iniciar Onda de Alocação</DialogTitle>
                          <DialogDescription>
                            Confirme o início da onda {selectedWave?.numero_onda}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Funcionário (opcional)</label>
                            <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecionar funcionário..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Atribuição automática</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedWave(null)
                                setFuncionarioId("")
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              onClick={handleStartWave}
                              disabled={startWave.isPending}
                            >
                              {startWave.isPending ? "Iniciando..." : "Iniciar"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Itens
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Itens da Onda {wave.numero_onda}</DialogTitle>
                        <DialogDescription>
                          Lista de todos os itens para alocação
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Lote</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Posição</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wave.allocation_wave_items?.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{item.produtos?.nome}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.produtos?.unidade_medida}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>{item.lote || '-'}</TableCell>
                                <TableCell>{item.quantidade}</TableCell>
                                <TableCell>
                                  {item.status === 'pendente' ? (
                                    <Badge variant="secondary">Pendente</Badge>
                                  ) : (
                                    <Badge variant="default">Alocado</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {item.storage_positions?.codigo || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}