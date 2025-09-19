import { useState } from "react"
import { Calendar, Route, MapPin, Clock, Plus, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Planejamento() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [routeFilter, setRouteFilter] = useState("all")

  // Mock data para rotas planejadas
  const rotas = [
    {
      id: "ROTA-001",
      nome: "Rota Norte",
      data: "2024-01-15",
      veiculo: "Truck 001",
      motorista: "João Silva",
      totalRemessas: 3,
      totalKm: 250,
      tempoEstimado: "6h 30min",
      status: "planejada",
      entregas: [
        { id: "ENT-001", cliente: "Fazenda Santa Maria", cidade: "Ribeirão Preto", horario: "08:00" },
        { id: "ENT-002", cliente: "Sítio Boa Vista", cidade: "Araraquara", horario: "10:30" },
        { id: "ENT-003", cliente: "Fazenda do Vale", cidade: "São Carlos", horario: "14:00" }
      ]
    },
    {
      id: "ROTA-002",
      nome: "Rota Sul",
      data: "2024-01-15",
      veiculo: "Truck 002", 
      motorista: "Pedro Santos",
      totalRemessas: 2,
      totalKm: 180,
      tempoEstimado: "4h 45min",
      status: "iniciada",
      entregas: [
        { id: "ENT-004", cliente: "Fazenda Esperança", cidade: "Piracicaba", horario: "09:00" },
        { id: "ENT-005", cliente: "Sítio Verde", cidade: "Limeira", horario: "11:30" }
      ]
    }
  ]

  const statusBadges = {
    planejada: { label: "Planejada", variant: "secondary" as const },
    iniciada: { label: "Iniciada", variant: "default" as const },
    em_andamento: { label: "Em Andamento", variant: "warning" as const },
    finalizada: { label: "Finalizada", variant: "success" as const }
  }

  const filteredRotas = rotas.filter(rota => {
    const matchesDate = rota.data === selectedDate
    const matchesRoute = routeFilter === "all" || rota.status === routeFilter
    return matchesDate && matchesRoute
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Route className="h-8 w-8" />
            Planejamento
          </h1>
          <p className="text-muted-foreground">
            Planejamento de rotas e otimização de entregas
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Rota</DialogTitle>
              <DialogDescription>
                Configure uma nova rota otimizada para entregas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome da Rota</label>
                  <Input placeholder="Ex: Rota Norte" />
                </div>
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Veículo</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck-001">Truck 001</SelectItem>
                      <SelectItem value="truck-002">Truck 002</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Motorista</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joao">João Silva</SelectItem>
                      <SelectItem value="pedro">Pedro Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Criar Rota</Button>
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
            <div>
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="planejada">Planejada</SelectItem>
                  <SelectItem value="iniciada">Iniciada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotas Planejadas</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRotas.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entregas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRotas.reduce((acc, r) => acc + r.totalRemessas, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KM</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRotas.reduce((acc, r) => acc + r.totalKm, 0)} km
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Estimado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(filteredRotas.reduce((acc, r) => acc + parseFloat(r.tempoEstimado), 0))}h
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Rotas</TabsTrigger>
          <TabsTrigger value="mapa">Visualização no Mapa</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle>Rotas do Dia</CardTitle>
              <CardDescription>
                Gerencie e otimize as rotas de entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRotas.length === 0 ? (
                <EmptyState
                  icon={Route}
                  title="Nenhuma rota encontrada"
                  description="Não há rotas planejadas para a data selecionada."
                />
              ) : (
                <div className="space-y-4">
                  {filteredRotas.map((rota) => (
                    <Card key={rota.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{rota.nome}</h3>
                          <Badge variant={statusBadges[rota.status as keyof typeof statusBadges].variant}>
                            {statusBadges[rota.status as keyof typeof statusBadges].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">Otimizar</Button>
                          <Button variant="outline" size="sm">Editar</Button>
                          <Button size="sm">Iniciar Rota</Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Veículo</p>
                          <p className="font-medium">{rota.veiculo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Motorista</p>
                          <p className="font-medium">{rota.motorista}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Distância</p>
                          <p className="font-medium">{rota.totalKm} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tempo Estimado</p>
                          <p className="font-medium">{rota.tempoEstimado}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Entregas ({rota.entregas.length})</h4>
                        <div className="space-y-2">
                          {rota.entregas.map((entrega, index) => (
                            <div key={entrega.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="font-medium">{entrega.cliente}</p>
                                  <p className="text-sm text-muted-foreground">{entrega.cidade}</p>
                                </div>
                              </div>
                              <div className="text-sm font-medium">
                                {entrega.horario}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Rotas</CardTitle>
              <CardDescription>
                Visualização das rotas no mapa para otimização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Mapa em Desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Integração com Google Maps ou similar será implementada aqui
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}