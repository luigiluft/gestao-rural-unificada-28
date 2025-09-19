import { useState } from "react"
import { Truck, Play, Square, MapPin, Clock, Fuel, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function Viagens() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data para viagens
  const viagens = [
    {
      id: "VIA-001",
      numero: "2024001",
      status: "em_andamento",
      rota: "Rota Norte",
      veiculo: "Truck 001 - ABC-1234",
      motorista: "João Silva",
      dataInicio: "2024-01-15T08:00:00",
      dataPrevisaoFim: "2024-01-15T16:30:00",
      hodometroInicio: 125000,
      hodometroAtual: 125180,
      totalRemessas: 3,
      remessasEntregues: 1,
      proximaParada: "Fazenda Santa Maria",
      distanciaTotal: 250,
      distanciaPercorrida: 180,
      combustivelInicio: 100,
      combustivelAtual: 75
    },
    {
      id: "VIA-002",
      numero: "2024002",
      status: "finalizada",
      rota: "Rota Sul",
      veiculo: "Truck 002 - DEF-5678",
      motorista: "Pedro Santos",
      dataInicio: "2024-01-14T09:00:00",
      dataFim: "2024-01-14T15:45:00",
      hodometroInicio: 98000,
      hodometroFim: 98200,
      totalRemessas: 2,
      remessasEntregues: 2,
      distanciaTotal: 200,
      distanciaPercorrida: 200,
      combustivelInicio: 95,
      combustivelFinal: 65
    }
  ]

  const statusBadges = {
    planejada: { label: "Planejada", variant: "secondary" as const },
    iniciada: { label: "Iniciada", variant: "default" as const },
    em_andamento: { label: "Em Andamento", variant: "outline" as const },
    finalizada: { label: "Finalizada", variant: "default" as const },
    cancelada: { label: "Cancelada", variant: "destructive" as const }
  }

  const filteredViagens = viagens.filter(viagem => {
    const matchesSearch = viagem.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         viagem.motorista.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         viagem.rota.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || viagem.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const calcularProgresso = (viagem: any) => {
    if (viagem.status === 'finalizada') return 100
    if (viagem.status === 'planejada') return 0
    return Math.round((viagem.distanciaPercorrida / viagem.distanciaTotal) * 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Viagens
          </h1>
          <p className="text-muted-foreground">
            Gestão e acompanhamento das viagens dos veículos
          </p>
        </div>
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
                placeholder="Buscar por número, motorista ou rota..."
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
                <SelectItem value="planejada">Planejada</SelectItem>
                <SelectItem value="iniciada">Iniciada</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viagens Ativas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.filter(v => v.status === 'em_andamento').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas Hoje</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.filter(v => v.status === 'finalizada').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KM Percorridos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.reduce((acc, v) => acc + v.distanciaPercorrida, 0)} km
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Realizadas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.reduce((acc, v) => acc + v.remessasEntregues, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ativas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ativas">Viagens Ativas</TabsTrigger>
          <TabsTrigger value="todas">Todas as Viagens</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="ativas">
          <div className="space-y-4">
            {viagens.filter(v => v.status === 'em_andamento').map((viagem) => (
              <Card key={viagem.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Viagem {viagem.numero}</h3>
                    <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges].variant}>
                      {statusBadges[viagem.status as keyof typeof statusBadges].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      Localizar
                    </Button>
                    <Button size="sm">
                      <Square className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Rota</p>
                    <p className="font-medium">{viagem.rota}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Veículo</p>
                    <p className="font-medium">{viagem.veiculo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Motorista</p>
                    <p className="font-medium">{viagem.motorista}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima Parada</p>
                    <p className="font-medium">{viagem.proximaParada}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso da Viagem</span>
                      <span>{calcularProgresso(viagem)}%</span>
                    </div>
                    <Progress value={calcularProgresso(viagem)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Distância</p>
                      <p className="font-medium">
                        {viagem.distanciaPercorrida} / {viagem.distanciaTotal} km
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entregas</p>
                      <p className="font-medium">
                        {viagem.remessasEntregues} / {viagem.totalRemessas}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Combustível</p>
                      <p className="font-medium">{viagem.combustivelAtual}%</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="todas">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Viagens</CardTitle>
              <CardDescription>
                Lista completa de viagens do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredViagens.length === 0 ? (
                <EmptyState
                  icon={<Truck className="h-8 w-8" />}
                  title="Nenhuma viagem encontrada"
                  description="Não há viagens que correspondem aos filtros selecionados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViagens.map((viagem) => (
                      <TableRow key={viagem.id}>
                        <TableCell className="font-medium">{viagem.numero}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges].variant}>
                            {statusBadges[viagem.status as keyof typeof statusBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{viagem.rota}</TableCell>
                        <TableCell>{viagem.motorista}</TableCell>
                        <TableCell>
                          {new Date(viagem.dataInicio).toLocaleDateString()} {new Date(viagem.dataInicio).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <div className="w-20">
                            <Progress value={calcularProgresso(viagem)} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Viagens</CardTitle>
              <CardDescription>
                Viagens finalizadas com relatórios detalhados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Relatórios detalhados e analytics das viagens finalizadas serão exibidos aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}