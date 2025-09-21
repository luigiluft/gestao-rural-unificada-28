import { useState } from "react"
import { Truck, Package, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { useRemessas } from "@/hooks/useRemessas"
import { useSaidasPendentes } from "@/hooks/useSaidasPendentes"
import { useTransferirSaidaParaRemessa } from "@/hooks/useTransferirSaidaParaRemessa"
import { useCorrigirStatusSaida } from "@/hooks/useCorrigirStatusSaida"

export default function Remessas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSaidas, setSelectedSaidas] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: remessas = [], isLoading, error } = useRemessas({
    status: statusFilter === "all" ? undefined : statusFilter
  })
  
  const { data: saidasExpedidas = [] } = useSaidasPendentes()
  const transferirMutation = useTransferirSaidaParaRemessa()
  const corrigirStatusMutation = useCorrigirStatusSaida()
  
  // Filter only expedited outputs for remessa creation
  const saidasParaRemessa = saidasExpedidas.filter(saida => saida.status === 'expedido')

  const handleTransferirSaidas = () => {
    if (selectedSaidas.length === 0) return
    
    transferirMutation.mutate({
      saidaIds: selectedSaidas
    }, {
      onSuccess: () => {
        setSelectedSaidas([])
        setDialogOpen(false)
      }
    })
  }

  const toggleSaidaSelection = (saidaId: string) => {
    setSelectedSaidas(prev => 
      prev.includes(saidaId) 
        ? prev.filter(id => id !== saidaId)
        : [...prev, saidaId]
    )
  }

  const handleCorrigirStatus = async (remessa: any) => {
    // First fetch the saida associated with this remessa
    const response = await fetch(`https://fejvckhuhflndcjuoppy.supabase.co/rest/v1/saidas?remessa_id=eq.${remessa.id}&select=id`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlanZja2h1aGZsbmRjanVvcHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkwMTgsImV4cCI6MjA3MDMzNTAxOH0.8hvIEXgBqhS5Z2QcdaNrr6n672EN-zUcmf3VPxgqEyE',
        'Content-Type': 'application/json'
      }
    });
    
    const saidas = await response.json();
    if (saidas && saidas.length > 0) {
      corrigirStatusMutation.mutate({
        remessaId: remessa.id,
        saidaId: saidas[0].id
      });
    }
  }

  const statusBadges = {
    criada: { label: "Criada", variant: "secondary" as const },
    pronta: { label: "Pronta", variant: "default" as const },
    despachada: { label: "Despachada", variant: "outline" as const },
    em_transito: { label: "Em Trânsito", variant: "outline" as const },
    entregue: { label: "Entregue", variant: "default" as const }
  }

  const filteredRemessas = remessas.filter(remessa => {
    const matchesSearch = remessa.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remessa.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar remessas: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            Remessas
          </h1>
          <p className="text-muted-foreground">
            Consolidação e organização de saídas em remessas para transporte
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Remessa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Remessa</DialogTitle>
              <DialogDescription>
                Selecione as saídas expedidas para consolidar em uma remessa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <h4 className="text-sm font-medium mb-3">
                  Saídas Expedidas Disponíveis ({saidasParaRemessa.length})
                </h4>
                {saidasParaRemessa.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                    Nenhuma saída expedida disponível para agrupamento
                  </p>
                ) : (
                  <div className="space-y-2">
                    {saidasParaRemessa.map((saida) => (
                      <div 
                        key={saida.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSaidas.includes(saida.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleSaidaSelection(saida.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedSaidas.includes(saida.id) 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {selectedSaidas.includes(saida.id) && (
                                <CheckCircle className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">SAI{saida.id.slice(-6).toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">
                                {(saida as any).produtor?.nome || "Produtor não identificado"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {saida.saida_itens?.length || 0} itens
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Expedido</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedSaidas.length > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedSaidas.length} saída(s) selecionada(s) para consolidação
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedSaidas([])
                    setDialogOpen(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={selectedSaidas.length === 0 || transferirMutation.isPending}
                  onClick={handleTransferirSaidas}
                >
                  {transferirMutation.isPending 
                    ? "Criando..." 
                    : `Criar Remessa (${selectedSaidas.length} saídas)`
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número da remessa ou destinatário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="criada">Criada</SelectItem>
                <SelectItem value="pronta">Pronta</SelectItem>
                <SelectItem value="despachada">Despachada</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Remessas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remessas.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {remessas.filter(r => r.status === 'em_transito').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volumes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {remessas.reduce((acc, r) => acc + (r.total_volumes || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peso Total (kg)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {remessas.reduce((acc, r) => acc + (r.peso_total || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Remessas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Remessas</CardTitle>
          <CardDescription>
            Gerencie suas remessas e acompanhe o status de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
              {filteredRemessas.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Nenhuma remessa encontrada"
              description="Não há remessas que correspondem aos filtros selecionados."
            />
              ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Total Saídas</TableHead>
                  <TableHead>Volumes</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemessas.map((remessa) => (
                  <TableRow key={remessa.id}>
                    <TableCell className="font-medium">{remessa.numero || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadges[remessa.status as keyof typeof statusBadges]?.variant || "secondary"}>
                        {statusBadges[remessa.status as keyof typeof statusBadges]?.label || remessa.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(remessa.data_criacao || remessa.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{remessa.total_saidas || 0}</TableCell>
                    <TableCell>{remessa.total_volumes || 0}</TableCell>
                    <TableCell>{(remessa.peso_total || 0).toLocaleString()}</TableCell>
                    <TableCell>R$ {(remessa.valor_total || 0).toLocaleString()}</TableCell>
                    <TableCell>{remessa.observacoes || '-'}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         {remessa.status === 'entregue' && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleCorrigirStatus(remessa)}
                             disabled={corrigirStatusMutation.isPending}
                             title="Corrigir status para expedido"
                           >
                             <Settings className="h-4 w-4" />
                           </Button>
                         )}
                         <Button variant="ghost" size="sm">
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm">
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}