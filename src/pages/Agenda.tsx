import { useState } from "react"
import { Calendar as CalendarIcon, Clock, Plus, Filter, User, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState("all")
  const [tipoFilter, setTipoFilter] = useState("all")

  // Mock data para agendamentos
  const agendamentos = [
    {
      id: "AGE-001",
      tipo: "entrega",
      cliente: "João Silva",
      telefone: "(16) 99999-1234",
      endereco: "Fazenda Santa Maria, Ribeirão Preto - SP",
      data: "2024-01-15",
      horario: "08:00",
      status: "confirmado",
      observacoes: "Portão principal, próximo ao silo",
      produto: "Milho - 50 sacos",
      responsavel: "Pedro Santos"
    },
    {
      id: "AGE-002", 
      tipo: "coleta",
      cliente: "Maria Costa",
      telefone: "(16) 98888-5678",
      endereco: "Sítio Boa Vista, Araraquara - SP",
      data: "2024-01-15",
      horario: "14:00",
      status: "pendente",
      observacoes: "Ligar antes de chegar",
      produto: "Soja - 100 sacos",
      responsavel: "João Silva"
    },
    {
      id: "AGE-003",
      tipo: "entrega",
      cliente: "Carlos Oliveira",
      telefone: "(16) 97777-9012",
      endereco: "Fazenda do Vale, São Carlos - SP", 
      data: "2024-01-16",
      horario: "10:30",
      status: "reagendado",
      observacoes: "Cliente reagendou para manhã",
      produto: "Fertilizante - 20 sacas",
      responsavel: "Ana Silva"
    }
  ]

  const statusBadges = {
    pendente: { label: "Pendente", variant: "secondary" as const },
    confirmado: { label: "Confirmado", variant: "default" as const },
    reagendado: { label: "Reagendado", variant: "warning" as const },
    concluido: { label: "Concluído", variant: "success" as const },
    cancelado: { label: "Cancelado", variant: "destructive" as const }
  }

  const tipoBadges = {
    entrega: { label: "Entrega", variant: "default" as const },
    coleta: { label: "Coleta", variant: "secondary" as const }
  }

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const matchesDate = agendamento.data === selectedDate.toISOString().split('T')[0]
    const matchesStatus = statusFilter === "all" || agendamento.status === statusFilter
    const matchesTipo = tipoFilter === "all" || agendamento.tipo === tipoFilter
    return matchesDate && matchesStatus && matchesTipo
  })

  // Horários disponíveis para agendamento
  const horariosDisponiveis = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Agenda
          </h1>
          <p className="text-muted-foreground">
            Agendamento de coletas e entregas
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Agendar uma nova coleta ou entrega
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrega">Entrega</SelectItem>
                      <SelectItem value="coleta">Coleta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <Input placeholder="Nome do cliente" />
                </div>
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.map(horario => (
                        <SelectItem key={horario} value={horario}>{horario}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Endereço</label>
                <Input placeholder="Endereço completo" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="text-sm font-medium">Produto/Descrição</label>
                <Input placeholder="Ex: Milho - 50 sacos" />
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea placeholder="Observações importantes..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Agendar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <CardDescription>
                Selecione uma data para ver os agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Agendamentos</span>
                <Badge variant="outline">{filteredAgendamentos.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Entregas</span>
                <Badge variant="default">
                  {filteredAgendamentos.filter(a => a.tipo === 'entrega').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Coletas</span>
                <Badge variant="secondary">
                  {filteredAgendamentos.filter(a => a.tipo === 'coleta').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Confirmados</span>
                <Badge variant="success">
                  {filteredAgendamentos.filter(a => a.status === 'confirmado').length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Agendamentos - {selectedDate.toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    Gerencie os agendamentos do dia selecionado
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrega">Entregas</SelectItem>
                      <SelectItem value="coleta">Coletas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="reagendado">Reagendado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAgendamentos.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="Nenhum agendamento encontrado"
                  description="Não há agendamentos para a data selecionada."
                />
              ) : (
                <div className="space-y-4">
                  {filteredAgendamentos
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .map((agendamento) => (
                    <Card key={agendamento.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                            <Clock className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{agendamento.horario}</h3>
                              <Badge variant={tipoBadges[agendamento.tipo as keyof typeof tipoBadges].variant}>
                                {tipoBadges[agendamento.tipo as keyof typeof tipoBadges].label}
                              </Badge>
                              <Badge variant={statusBadges[agendamento.status as keyof typeof statusBadges].variant}>
                                {statusBadges[agendamento.status as keyof typeof statusBadges].label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{agendamento.cliente}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{agendamento.telefone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{agendamento.endereco}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Produto:</span> {agendamento.produto}
                            </div>
                            {agendamento.observacoes && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Obs:</span> {agendamento.observacoes}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Responsável:</span> {agendamento.responsavel}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          {agendamento.status === 'confirmado' && (
                            <Button size="sm">
                              Concluir
                            </Button>
                          )}
                          {agendamento.status === 'pendente' && (
                            <Button size="sm">
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}