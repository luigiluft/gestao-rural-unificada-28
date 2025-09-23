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
import { Checkbox } from "@/components/ui/checkbox"
import { useRemessas } from "@/hooks/useRemessas"
import { useSaidasPendentes } from "@/hooks/useSaidasPendentes"
import { useCorrigirStatusSaida } from "@/hooks/useCorrigirStatusSaida"
import { NovaViagemComRemessasDialog } from "@/components/Viagens/NovaViagemComRemessasDialog"
import GanttChart from "@/components/Remessas/GanttChart"

export default function Remessas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRemessas, setSelectedRemessas] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: remessas = [], isLoading, error } = useRemessas({
    status: statusFilter === "all" ? undefined : statusFilter
  })
  
  const { data: saidasExpedidas = [] } = useSaidasPendentes()
  
  const corrigirStatusMutation = useCorrigirStatusSaida()
  
  // Filter only expedited outputs for remessa creation
  const saidasParaRemessa = saidasExpedidas.filter(saida => saida.status === 'expedido')


  const toggleRemessaSelection = (remessaId: string) => {
    setSelectedRemessas(prev => 
      prev.includes(remessaId) 
        ? prev.filter(id => id !== remessaId)
        : [...prev, remessaId]
    )
  }

  const selectAllRemessas = () => {
    if (selectedRemessas.length === filteredRemessas.length) {
      setSelectedRemessas([])
    } else {
      setSelectedRemessas(filteredRemessas.map(r => r.id))
    }
  }

  const clearSelection = () => {
    setSelectedRemessas([])
  }

  const handleViagemSuccess = () => {
    setSelectedRemessas([])
    setDialogOpen(false)
  }

  const handleCorrigirStatus = async (saida: any) => {
    try {
      await corrigirStatusMutation.mutateAsync({
        saidaId: saida.id
      })
    } catch (error) {
      console.error("Erro ao corrigir status:", error)
    }
  }

  const statusBadges = {
    expedido: { label: "Expedido", variant: "default" as const },
    entregue: { label: "Entregue", variant: "default" as const }
  }

  const filteredRemessas = remessas.filter(saida => {
    const matchesSearch = saida.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         saida.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Saídas Expedidas
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de saídas expedidas prontas para transporte
          </p>
        </div>
        
        {selectedRemessas.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRemessas.length} remessa(s) selecionada(s)
            </span>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Viagem
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelection}
              size="sm"
            >
              Limpar Seleção
            </Button>
          </div>
        )}
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
                placeholder="Buscar por número da saída ou observações..."
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
                <SelectItem value="expedido">Expedido</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
            {filteredRemessas.length > 0 && (
              <Button 
                variant="outline" 
                onClick={selectAllRemessas}
                size="sm"
              >
                {selectedRemessas.length === filteredRemessas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remessas.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expedidas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {remessas.filter(r => r.status === 'expedido').length}
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
              {remessas.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {remessas.reduce((acc, r) => acc + (r.valor_total || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <GanttChart remessas={filteredRemessas} />

      {/* Lista de Remessas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Saídas Expedidas</CardTitle>
          <CardDescription>
            Gerencie suas saídas expedidas e acompanhe o status de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
              {filteredRemessas.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Nenhuma saída expedida encontrada"
              description="Não há saídas expedidas que correspondem aos filtros selecionados."
            />
              ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredRemessas.length > 0 && selectedRemessas.length === filteredRemessas.length}
                      onCheckedChange={selectAllRemessas}
                    />
                  </TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Saída</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemessas.map((saida) => (
                  <TableRow key={saida.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRemessas.includes(saida.id)}
                        onCheckedChange={() => toggleRemessaSelection(saida.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{saida.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadges[saida.status as keyof typeof statusBadges]?.variant || "secondary"}>
                        {statusBadges[saida.status as keyof typeof statusBadges]?.label || saida.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(saida.data_saida).toLocaleDateString()}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>R$ {(saida.valor_total || 0).toLocaleString()}</TableCell>
                    <TableCell>{saida.observacoes || '-'}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         {saida.status === 'entregue' && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleCorrigirStatus(saida)}
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

      <NovaViagemComRemessasDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        remessasSelecionadas={filteredRemessas.filter(r => selectedRemessas.includes(r.id))}
        onSuccess={handleViagemSuccess}
      />
    </div>
  )
}