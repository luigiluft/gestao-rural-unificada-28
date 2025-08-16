import { useState } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Package,
  Truck,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormularioSaida } from "@/components/Saidas/FormularioSaida"
import { useSaidas, useSaidaStats } from "@/hooks/useSaidas"
import { Skeleton } from "@/components/ui/skeleton"

import { useQueryClient } from "@tanstack/react-query"

export default function Saidas() {
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const queryClient = useQueryClient()
  
  const { data: saidas, isLoading } = useSaidas()
  const { data: stats } = useSaidaStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "entregue":
        return "default"
      case "expedido":
      case "separado":
        return "secondary"
      case "separacao_pendente":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleSaidaSubmit = () => {
    setIsNewSaidaOpen(false)
    queryClient.invalidateQueries({ queryKey: ["saidas"] })
    queryClient.invalidateQueries({ queryKey: ["saida-stats"] })
    queryClient.invalidateQueries({ queryKey: ["estoque"] })
  }

  // Filtrar saídas baseado no termo de busca
  const saidasFiltradas = saidas?.filter(saida => 
    saida.destinatario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saida.tipo_saida?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saida.saida_itens?.some(item => 
      item.produtos?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saídas</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as saídas de produtos do estoque
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Dialog open={isNewSaidaOpen} onOpenChange={setIsNewSaidaOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Saída
              </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Saída</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da saída de produtos do estoque
                  </DialogDescription>
                </DialogHeader>
                <FormularioSaida
                  onSubmit={handleSaidaSubmit}
                  onCancel={() => setIsNewSaidaOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saídas Hoje</p>
                  <p className="text-2xl font-bold">{stats?.saidasHoje || 0}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Preparação</p>
                  <p className="text-2xl font-bold text-warning">{stats?.preparando || 0}</p>
                </div>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Package className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expedidas</p>
                  <p className="text-2xl font-bold text-secondary-foreground">{stats?.expedidas || 0}</p>
                </div>
                <div className="p-2 bg-secondary rounded-lg">
                  <Truck className="w-5 h-5 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold text-success">{stats?.entregues || 0}</p>
                </div>
                <div className="p-2 bg-success/10 rounded-lg">
                  <Package className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, destino ou tipo..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Período
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saidas Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Lista de Saídas</CardTitle>
            <CardDescription>
              {saidasFiltradas.length} saídas registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : saidasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma saída encontrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Não há saídas registradas no sistema.
                </p>
                <Button onClick={() => setIsNewSaidaOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primeira Saída
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saidasFiltradas.map((saida) => (
                      <TableRow key={saida.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          SAI{saida.id.slice(-3).toUpperCase()}
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1">
                             {saida.saida_itens?.slice(0, 2).map((item, idx) => (
                               <div key={idx} className="flex items-center gap-2">
                                 <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                                   <Package className="w-3 h-3 text-primary" />
                                 </div>
                                 <span className="text-sm">
                                   {item.produtos?.nome || "Nome não disponível"} ({item.quantidade || 0} {item.produtos?.unidade_medida || "un"})
                                 </span>
                               </div>
                             ))}
                            {(saida.saida_itens?.length || 0) > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{(saida.saida_itens?.length || 0) - 2} mais
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(saida.data_saida).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{saida.destinatario || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{saida.tipo_saida || "Não definido"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(saida.status || "separacao_pendente") as "default" | "secondary" | "outline" | "destructive"}>
                            {saida.status === 'separacao_pendente' ? 'Separação Pendente' : 
                             saida.status === 'separado' ? 'Separado' :
                             saida.status === 'expedido' ? 'Expedido' :
                             saida.status === 'entregue' ? 'Entregue' : 
                             saida.status || "Separação Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {(saida.valor_total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}