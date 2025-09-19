import { useState } from "react"
import { AlertTriangle, Plus, Search, Filter, Clock, CheckCircle, X, Camera } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function Ocorrencias() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tipoFilter, setTipoFilter] = useState("all")

  // Mock data para ocorrências
  const ocorrencias = [
    {
      id: "OCO-001",
      numero: "2024001",
      tipo: "atraso",
      severidade: "media",
      titulo: "Atraso na entrega por problema mecânico",
      descricao: "Veículo apresentou problema no sistema de freios durante a viagem",
      entregaId: "ENT-003",
      cliente: "Carlos Oliveira",
      motorista: "Ana Silva",
      veiculo: "Truck 001 - ABC-1234",
      dataOcorrencia: "2024-01-15T11:30:00",
      status: "aberta",
      prioridade: "alta",
      responsavel: "João Silva",
      acaoCorretiva: null,
      tempoResolucao: null,
      fotos: 2,
      localizacao: "Rod. Washington Luís, KM 235"
    },
    {
      id: "OCO-002",
      numero: "2024002",
      tipo: "avaria",
      severidade: "baixa",
      titulo: "Sacas molhadas durante transporte",
      descricao: "Algumas sacas de milho ficaram molhadas devido à chuva",
      entregaId: "ENT-001",
      cliente: "João Silva",
      motorista: "Pedro Santos",
      veiculo: "Truck 001 - ABC-1234",
      dataOcorrencia: "2024-01-14T15:20:00",
      status: "resolvida",
      prioridade: "media",
      responsavel: "Maria Santos",
      acaoCorretiva: "Produtos foram secos e reembalados. Cliente foi ressarcido",
      tempoResolucao: "2h 30min",
      fotos: 4,
      localizacao: "Fazenda Santa Maria"
    },
    {
      id: "OCO-003",
      numero: "2024003",
      tipo: "recusa",
      severidade: "alta",
      titulo: "Cliente recusou recebimento",
      descricao: "Cliente alegou que não fez o pedido e recusou o recebimento",
      entregaId: "ENT-005",
      cliente: "Maria Costa",
      motorista: "João Silva",
      veiculo: "Truck 002 - DEF-5678",
      dataOcorrencia: "2024-01-13T14:15:00",
      status: "em_andamento",
      prioridade: "alta",
      responsavel: "Pedro Santos",
      acaoCorretiva: "Verificando documentação do pedido com o setor comercial",
      tempoResolucao: null,
      fotos: 1,
      localizacao: "Sítio Boa Vista"
    }
  ]

  const statusBadges = {
    aberta: { label: "Aberta", variant: "destructive" as const },
    em_andamento: { label: "Em Andamento", variant: "secondary" as const },
    resolvida: { label: "Resolvida", variant: "default" as const },
    fechada: { label: "Fechada", variant: "secondary" as const }
  }

  const tipoBadges = {
    atraso: { label: "Atraso", variant: "secondary" as const },
    avaria: { label: "Avaria", variant: "destructive" as const },
    recusa: { label: "Recusa", variant: "secondary" as const },
    endereco: { label: "Endereço", variant: "default" as const },
    documentacao: { label: "Documentação", variant: "outline" as const }
  }

  const severidadeBadges = {
    baixa: { label: "Baixa", variant: "secondary" as const },
    media: { label: "Média", variant: "default" as const },
    alta: { label: "Alta", variant: "destructive" as const }
  }

  const filteredOcorrencias = ocorrencias.filter(ocorrencia => {
    const matchesSearch = ocorrencia.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ocorrencia.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ocorrencia.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ocorrencia.status === statusFilter
    const matchesTipo = tipoFilter === "all" || ocorrencia.tipo === tipoFilter
    return matchesSearch && matchesStatus && matchesTipo
  })

  const calcularTempoAberto = (dataOcorrencia: string) => {
    const agora = new Date()
    const data = new Date(dataOcorrencia)
    const diferenca = agora.getTime() - data.getTime()
    
    const horas = Math.floor(diferenca / (1000 * 60 * 60))
    const dias = Math.floor(horas / 24)
    
    if (dias > 0) return `${dias}d ${horas % 24}h`
    return `${horas}h`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Ocorrências
          </h1>
          <p className="text-muted-foreground">
            Registro e gestão de problemas durante o transporte
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nova Ocorrência</DialogTitle>
              <DialogDescription>
                Registre um problema ocorrido durante o transporte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Ocorrência</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atraso">Atraso</SelectItem>
                      <SelectItem value="avaria">Avaria</SelectItem>
                      <SelectItem value="recusa">Recusa</SelectItem>
                      <SelectItem value="endereco">Endereço não localizado</SelectItem>
                      <SelectItem value="documentacao">Problema de documentação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Severidade</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar severidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Entrega Relacionada</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENT-001">ENT-001 - João Silva</SelectItem>
                      <SelectItem value="ENT-002">ENT-002 - Maria Santos</SelectItem>
                      <SelectItem value="ENT-003">ENT-003 - Carlos Oliveira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <Input placeholder="Local onde ocorreu o problema" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input placeholder="Resumo do problema" />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição Detalhada</label>
                <Textarea placeholder="Descreva o problema em detalhes..." />
              </div>
              <div>
                <label className="text-sm font-medium">Fotos (Opcional)</label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para adicionar fotos da ocorrência
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Registrar Ocorrência</Button>
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
                placeholder="Buscar por número, cliente ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="atraso">Atraso</SelectItem>
                <SelectItem value="avaria">Avaria</SelectItem>
                <SelectItem value="recusa">Recusa</SelectItem>
                <SelectItem value="endereco">Endereço</SelectItem>
                <SelectItem value="documentacao">Documentação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvida">Resolvida</SelectItem>
                <SelectItem value="fechada">Fechada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocorrências Abertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {ocorrencias.filter(o => o.status === 'aberta').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {ocorrencias.filter(o => o.status === 'em_andamento').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {ocorrencias.filter(o => o.status === 'resolvida').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((ocorrencias.filter(o => o.status === 'resolvida').length / ocorrencias.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Ocorrências</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle>Ocorrências Registradas</CardTitle>
              <CardDescription>
                Gerencie e acompanhe as ocorrências do transporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOcorrencias.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="h-8 w-8" />}
                  title="Nenhuma ocorrência encontrada"
                  description="Não há ocorrências que correspondem aos filtros selecionados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo Aberto</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOcorrencias.map((ocorrencia) => (
                      <TableRow key={ocorrencia.id}>
                        <TableCell className="font-medium">{ocorrencia.numero}</TableCell>
                        <TableCell>
                          <Badge variant={tipoBadges[ocorrencia.tipo as keyof typeof tipoBadges].variant}>
                            {tipoBadges[ocorrencia.tipo as keyof typeof tipoBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{ocorrencia.titulo}</TableCell>
                        <TableCell>{ocorrencia.cliente}</TableCell>
                        <TableCell>
                          <Badge variant={severidadeBadges[ocorrencia.severidade as keyof typeof severidadeBadges].variant}>
                            {severidadeBadges[ocorrencia.severidade as keyof typeof severidadeBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadges[ocorrencia.status as keyof typeof statusBadges].variant}>
                            {statusBadges[ocorrencia.status as keyof typeof statusBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{calcularTempoAberto(ocorrencia.dataOcorrencia)}</TableCell>
                        <TableCell>{ocorrencia.responsavel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Detalhes
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Ocorrência {ocorrencia.numero}</DialogTitle>
                                  <DialogDescription>
                                    Detalhes completos da ocorrência
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Tipo:</strong> {tipoBadges[ocorrencia.tipo as keyof typeof tipoBadges].label}
                                    </div>
                                    <div>
                                      <strong>Severidade:</strong> {severidadeBadges[ocorrencia.severidade as keyof typeof severidadeBadges].label}
                                    </div>
                                    <div>
                                      <strong>Cliente:</strong> {ocorrencia.cliente}
                                    </div>
                                    <div>
                                      <strong>Motorista:</strong> {ocorrencia.motorista}
                                    </div>
                                    <div>
                                      <strong>Veículo:</strong> {ocorrencia.veiculo}
                                    </div>
                                    <div>
                                      <strong>Local:</strong> {ocorrencia.localizacao}
                                    </div>
                                  </div>
                                  <div>
                                    <strong>Descrição:</strong>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {ocorrencia.descricao}
                                    </p>
                                  </div>
                                  {ocorrencia.acaoCorretiva && (
                                    <div>
                                      <strong>Ação Corretiva:</strong>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {ocorrencia.acaoCorretiva}
                                      </p>
                                    </div>
                                  )}
                                  {ocorrencia.fotos > 0 && (
                                    <div>
                                      <strong>Anexos:</strong>
                                      <p className="text-sm text-muted-foreground">
                                        {ocorrencia.fotos} foto(s) anexada(s)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            {ocorrencia.status !== 'resolvida' && (
                              <Button variant="outline" size="sm">
                                Resolver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ocorrências por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(tipoBadges).map(([tipo, badge]) => {
                    const count = ocorrencias.filter(o => o.tipo === tipo).length
                    const percentage = (count / ocorrencias.length) * 100
                    return (
                      <div key={tipo} className="flex items-center justify-between">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">4h 20min</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tempo médio para resolver ocorrências
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}