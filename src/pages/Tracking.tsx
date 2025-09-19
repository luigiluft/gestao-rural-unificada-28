import { useState } from "react"
import { MapPin, Truck, Clock, Route, Search, Navigation, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function Tracking() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data para rastreamento
  const entregas = [
    {
      id: "ENT-001",
      codigo: "TRK001",
      cliente: "João Silva",
      destino: "Fazenda Santa Maria, Ribeirão Preto - SP",
      produto: "Milho - 50 sacos",
      veiculo: "Truck 001 - ABC-1234",
      motorista: "Pedro Santos",
      status: "em_transito",
      dataPartida: "2024-01-15T08:00:00",
      previsaoChegada: "2024-01-15T12:30:00",
      ultimaAtualizacao: "2024-01-15T10:15:00",
      localizacaoAtual: "Rod. Anhanguera, KM 325",
      distanciaTotal: 180,
      distanciaPercorrida: 120,
      eventos: [
        { hora: "08:00", descricao: "Saída do depósito", local: "Centro de Distribuição" },
        { hora: "09:15", descricao: "Passagem pelo pedágio", local: "Pedágio Anhanguera" },
        { hora: "10:15", descricao: "Parada para abastecimento", local: "Posto BR - KM 325" }
      ]
    },
    {
      id: "ENT-002",
      codigo: "TRK002", 
      cliente: "Maria Santos",
      destino: "Sítio Boa Vista, Araraquara - SP",
      produto: "Soja - 100 sacos",
      veiculo: "Truck 002 - DEF-5678",
      motorista: "João Silva",
      status: "entregue",
      dataPartida: "2024-01-14T09:00:00",
      dataEntrega: "2024-01-14T13:45:00",
      ultimaAtualizacao: "2024-01-14T13:45:00",
      localizacaoAtual: "Destino",
      distanciaTotal: 120,
      distanciaPercorrida: 120,
      eventos: [
        { hora: "09:00", descricao: "Saída do depósito", local: "Centro de Distribuição" },
        { hora: "11:30", descricao: "Chegada ao destino", local: "Sítio Boa Vista" },
        { hora: "13:45", descricao: "Entrega concluída", local: "Sítio Boa Vista" }
      ]
    },
    {
      id: "ENT-003",
      codigo: "TRK003",
      cliente: "Carlos Oliveira", 
      destino: "Fazenda do Vale, São Carlos - SP",
      produto: "Fertilizante - 20 sacas",
      veiculo: "Truck 001 - ABC-1234",
      motorista: "Ana Silva",
      status: "atrasado",
      dataPartida: "2024-01-15T07:00:00",
      previsaoChegada: "2024-01-15T11:00:00",
      ultimaAtualizacao: "2024-01-15T11:30:00",
      localizacaoAtual: "Parado - Problema mecânico",
      distanciaTotal: 200,
      distanciaPercorrida: 150,
      eventos: [
        { hora: "07:00", descricao: "Saída do depósito", local: "Centro de Distribuição" },
        { hora: "09:30", descricao: "Passagem por São Carlos", local: "Entrada da cidade" },
        { hora: "11:30", descricao: "Veículo parado - Problema mecânico", local: "Rod. Washington Luís, KM 235" }
      ]
    }
  ]

  const statusBadges = {
    em_transito: { label: "Em Trânsito", variant: "default" as const },
    entregue: { label: "Entregue", variant: "success" as const },
    atrasado: { label: "Atrasado", variant: "destructive" as const },
    coletando: { label: "Coletando", variant: "warning" as const }
  }

  const filteredEntregas = entregas.filter(entrega => {
    const matchesSearch = entrega.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrega.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrega.motorista.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || entrega.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const calcularProgresso = (entrega: any) => {
    return Math.round((entrega.distanciaPercorrida / entrega.distanciaTotal) * 100)
  }

  const calcularTempoRestante = (entrega: any) => {
    if (entrega.status === 'entregue') return "Entregue"
    if (entrega.status === 'atrasado') return "Atrasado"
    
    const agora = new Date()
    const previsao = new Date(entrega.previsaoChegada)
    const diferenca = previsao.getTime() - agora.getTime()
    
    if (diferenca <= 0) return "Atrasado"
    
    const horas = Math.floor(diferenca / (1000 * 60 * 60))
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${horas}h ${minutos}min`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Navigation className="h-8 w-8" />
            Tracking
          </h1>
          <p className="text-muted-foreground">
            Rastreamento em tempo real das entregas
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
                placeholder="Buscar por código, cliente ou motorista..."
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
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="coletando">Coletando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entregas.filter(e => e.status === 'em_transito').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues Hoje</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entregas.filter(e => e.status === 'entregue').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {entregas.filter(e => e.status === 'atrasado').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KM Percorridos</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entregas.reduce((acc, e) => acc + e.distanciaPercorrida, 0)} km
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Entregas</TabsTrigger>
          <TabsTrigger value="mapa">Mapa em Tempo Real</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <div className="space-y-4">
            {filteredEntregas.length === 0 ? (
              <EmptyState
                icon={Navigation}
                title="Nenhuma entrega encontrada"
                description="Não há entregas que correspondem aos filtros selecionados."
              />
            ) : (
              filteredEntregas.map((entrega) => (
                <Card key={entrega.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">#{entrega.codigo}</h3>
                      <Badge variant={statusBadges[entrega.status as keyof typeof statusBadges].variant}>
                        {statusBadges[entrega.status as keyof typeof statusBadges].label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tempo restante</p>
                      <p className="font-semibold">{calcularTempoRestante(entrega)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{entrega.cliente}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Motorista</p>
                      <p className="font-medium">{entrega.motorista}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Veículo</p>
                      <p className="font-medium">{entrega.veiculo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produto</p>
                      <p className="font-medium">{entrega.produto}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Destino</p>
                    <p className="font-medium">{entrega.destino}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso da Entrega</span>
                        <span>{calcularProgresso(entrega)}%</span>
                      </div>
                      <Progress value={calcularProgresso(entrega)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Localização Atual</p>
                        <p className="font-medium">{entrega.localizacaoAtual}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última Atualização</p>
                        <p className="font-medium">
                          {new Date(entrega.ultimaAtualizacao).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Timeline de Eventos</p>
                      <div className="space-y-2">
                        {entrega.eventos.map((evento, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 bg-muted rounded">
                            <div className="w-12 h-6 bg-primary text-primary-foreground rounded text-xs flex items-center justify-center">
                              {evento.hora}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{evento.descricao}</p>
                              <p className="text-xs text-muted-foreground">{evento.local}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      Ver no Mapa
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Histórico
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle>Mapa em Tempo Real</CardTitle>
              <CardDescription>
                Visualização das entregas em andamento no mapa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Mapa em Desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Integração com Google Maps ou similar para rastreamento em tempo real
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