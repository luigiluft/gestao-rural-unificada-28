import { useState } from "react"
import { Truck, Package, Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"

export default function Remessas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data para remessas
  const remessas = [
    {
      id: "REM-001",
      numero: "2024001",
      status: "criada",
      dataCreacao: "2024-01-15",
      totalSaidas: 3,
      totalVolumes: 150,
      pesoTotal: 2500,
      destinatarios: ["João Silva", "Maria Santos"],
      valorTotal: 15000
    },
    {
      id: "REM-002", 
      numero: "2024002",
      status: "despachada",
      dataCreacao: "2024-01-14",
      totalSaidas: 2,
      totalVolumes: 80,
      pesoTotal: 1200,
      destinatarios: ["Pedro Costa"],
      valorTotal: 8500
    }
  ]

  const statusBadges = {
    criada: { label: "Criada", variant: "secondary" as const },
    despachada: { label: "Despachada", variant: "default" as const },
    em_transito: { label: "Em Trânsito", variant: "warning" as const },
    entregue: { label: "Entregue", variant: "success" as const }
  }

  const filteredRemessas = remessas.filter(remessa => {
    const matchesSearch = remessa.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remessa.destinatarios.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || remessa.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
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
              <p className="text-sm text-muted-foreground">
                Aqui seria exibida uma lista de saídas com status "expedido" disponíveis para agrupamento
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Criar Remessa</Button>
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
              {remessas.reduce((acc, r) => acc + r.totalVolumes, 0)}
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
              {remessas.reduce((acc, r) => acc + r.pesoTotal, 0).toLocaleString()}
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
              icon={Package}
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
                  <TableHead>Saídas</TableHead>
                  <TableHead>Volumes</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemessas.map((remessa) => (
                  <TableRow key={remessa.id}>
                    <TableCell className="font-medium">{remessa.numero}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadges[remessa.status as keyof typeof statusBadges].variant}>
                        {statusBadges[remessa.status as keyof typeof statusBadges].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(remessa.dataCreacao).toLocaleDateString()}</TableCell>
                    <TableCell>{remessa.totalSaidas}</TableCell>
                    <TableCell>{remessa.totalVolumes}</TableCell>
                    <TableCell>{remessa.pesoTotal.toLocaleString()}</TableCell>
                    <TableCell>{remessa.destinatarios.join(", ")}</TableCell>
                    <TableCell>R$ {remessa.valorTotal.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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