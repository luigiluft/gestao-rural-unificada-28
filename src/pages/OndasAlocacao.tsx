import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePalletAllocationWaves, useStartAllocationWave, useDefineWavePositions } from "@/hooks/useAllocationWaves"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Package, Play, Clock, CheckCircle, Eye, MapPin } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function OndasAlocacao() {
  const navigate = useNavigate()
  const { data: waves, isLoading } = usePalletAllocationWaves()
  const { mutate: startWave, isPending } = useStartAllocationWave()
  const { mutate: definePositions, isPending: isDefiningPositions } = useDefineWavePositions()
  const [selectedWave, setSelectedWave] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [processingWaveId, setProcessingWaveId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3" />
            Aguardando Posições
          </Badge>
        )
      case "posicoes_definidas":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Package className="h-3 w-3" />
            Pronto para Alocação
          </Badge>
        )
      case "em_andamento":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
            <Play className="h-3 w-3" />
            Em Andamento
          </Badge>
        )
      case "concluido":
        return (
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Concluído
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const handleExecuteAllocation = (waveId: string) => {
    setProcessingWaveId(waveId)
    definePositions(
      { waveId },
      {
        onSuccess: (result: any) => {
          if (result?.success) {
            startWave(
              { waveId },
              {
                onSuccess: () => {
                  navigate(`/alocar-scanner/${waveId}`)
                },
                onSettled: () => {
                  setProcessingWaveId(null)
                }
              }
            )
          } else {
            setProcessingWaveId(null)
          }
        },
        onError: () => {
          setProcessingWaveId(null)
        }
      }
    )
  }

  const handleManualAllocation = (waveId: string) => {
    setProcessingWaveId(waveId)
    definePositions(
      { waveId },
      {
        onSuccess: (result: any) => {
          if (result?.success) {
            navigate(`/alocar-manual/${waveId}`)
          }
          setProcessingWaveId(null)
        },
        onError: () => {
          setProcessingWaveId(null)
        }
      }
    )
  }

  // Função removida - não precisamos mais definir posições manualmente para pallets
  // const handleDefinePositions = (waveId: string) => {
  //   definePositions({ waveId })
  // }

  const getTotalPallets = (wave: any) => {
    return wave.total_pallets || 0
  }

  const getPalletsAlocados = (wave: any) => {
    return wave.pallets_alocados || 0
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

  if (!waves || !Array.isArray(waves) || waves.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ondas de Alocação</h1>
          <p className="text-muted-foreground">
            Gerencie as ondas de alocação de produtos no estoque
          </p>
        </div>
        
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title="Nenhuma onda de alocação encontrada"
          description="As ondas de alocação são criadas automaticamente quando entradas são confirmadas."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ondas de Alocação</h1>
        <p className="text-muted-foreground">
          Gerencie as ondas de alocação de produtos no estoque
        </p>
      </div>

      <div className="grid gap-6">
        {Array.isArray(waves) ? waves.map((wave: any) => (
          <Card key={wave.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {wave.numero_onda}
                  </CardTitle>
                  <CardDescription>
                    {wave.franquia_nome} • {getTotalPallets(wave)} pallets
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
                  <div>
                    <span className="font-medium">Progresso:</span>
                    <p className="text-muted-foreground">
                      {getPalletsAlocados(wave)} / {getTotalPallets(wave)} pallets
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
                  {getTotalPallets(wave) === 0 ? (
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                      Onda sem itens para alocar
                    </div>
                  ) : (
                    <>
                       {(wave.status === "pendente" || wave.status === "posicoes_definidas") && (
                         <>
                           <Button
                             size="sm"
                             onClick={() => handleExecuteAllocation(wave.id)}
                             disabled={processingWaveId === wave.id}
                             className="flex items-center gap-2"
                           >
                             <Play className="h-4 w-4" />
                             {processingWaveId === wave.id ? "Calculando posições..." : "Alocação com Scanner"}
                           </Button>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleManualAllocation(wave.id)}
                             disabled={processingWaveId === wave.id}
                             className="flex items-center gap-2"
                           >
                             <Package className="h-4 w-4" />
                             {processingWaveId === wave.id ? "Calculando posições..." : "Alocação Manual"}
                           </Button>
                         </>
                       )}
                      
                       {wave.status === "em_andamento" && (
                         <>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => navigate(`/alocar-scanner/${wave.id}`)}
                             className="flex items-center gap-2"
                           >
                             <Play className="h-4 w-4" />
                             Continuar Alocação com Scanner
                           </Button>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => navigate(`/alocar-manual/${wave.id}`)}
                             className="flex items-center gap-2"
                           >
                             <Package className="h-4 w-4" />
                             Continuar Alocação Manual
                           </Button>
                         </>
                       )}
                    </>
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
                            <DialogTitle>Pallets da Onda {wave.numero_onda}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pallet</TableHead>
                                  <TableHead>Código de Barras</TableHead>
                                  <TableHead>Produtos</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Posição</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {wave.allocation_wave_pallets?.map((pallet: any) => (
                                  <TableRow key={pallet.id}>
                                    <TableCell>
                                      Pallet {pallet.entrada_pallets?.numero_pallet}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {pallet.codigo_barras_pallet}
                                    </TableCell>
                                    <TableCell>
                                      {pallet.entrada_pallets?.entrada_pallet_itens?.length || 0} itens
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={
                                        pallet.status === 'alocado' 
                                          ? 'default' 
                                          : pallet.status === 'com_divergencia'
                                          ? 'destructive'
                                          : 'secondary'
                                      }>
                                        {pallet.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {pallet.storage_positions?.codigo || 'Não definida'}
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
        )) : null}
      </div>
    </div>
  )
}