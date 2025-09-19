import { useState } from "react"
import { FileText, Camera, CheckCircle, Upload, Download, Eye, Search } from "lucide-react"
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

export default function ProofOfDelivery() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data para comprovantes de entrega
  const comprovantes = [
    {
      id: "POD-001",
      entregaId: "ENT-001",
      codigo: "TRK001",
      cliente: "João Silva",
      produto: "Milho - 50 sacos",
      dataEntrega: "2024-01-15T14:30:00",
      recebidoPor: "João Silva",
      documentoRecebedor: "123.456.789-00",
      motorista: "Pedro Santos",
      veiculo: "Truck 001 - ABC-1234",
      status: "completo",
      assinatura: true,
      fotos: 3,
      observacoes: "Produto entregue em perfeitas condições",
      localizacao: "Fazenda Santa Maria, Ribeirão Preto - SP"
    },
    {
      id: "POD-002",
      entregaId: "ENT-002", 
      codigo: "TRK002",
      cliente: "Maria Santos",
      produto: "Soja - 100 sacos",
      dataEntrega: "2024-01-14T16:45:00",
      recebidoPor: "Carlos Santos",
      documentoRecebedor: "987.654.321-00",
      motorista: "João Silva",
      veiculo: "Truck 002 - DEF-5678",
      status: "completo",
      assinatura: true,
      fotos: 5,
      observacoes: "Descarga realizada no galpão principal",
      localizacao: "Sítio Boa Vista, Araraquara - SP"
    },
    {
      id: "POD-003",
      entregaId: "ENT-003",
      codigo: "TRK003", 
      cliente: "Carlos Oliveira",
      produto: "Fertilizante - 20 sacas",
      dataEntrega: null,
      recebidoPor: null,
      documentoRecebedor: null,
      motorista: "Ana Silva",
      veiculo: "Truck 001 - ABC-1234",
      status: "pendente",
      assinatura: false,
      fotos: 0,
      observacoes: null,
      localizacao: "Fazenda do Vale, São Carlos - SP"
    }
  ]

  const statusBadges = {
    pendente: { label: "Pendente", variant: "secondary" as const },
    completo: { label: "Completo", variant: "success" as const },
    incompleto: { label: "Incompleto", variant: "warning" as const },
    rejeitado: { label: "Rejeitado", variant: "destructive" as const }
  }

  const filteredComprovantes = comprovantes.filter(comprovante => {
    const matchesSearch = comprovante.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.motorista.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || comprovante.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Proof of Delivery
          </h1>
          <p className="text-muted-foreground">
            Comprovação digital de entrega com assinatura e fotos
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
                <SelectItem value="incompleto">Incompleto</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PODs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comprovantes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {comprovantes.filter(c => c.status === 'completo').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {comprovantes.filter(c => c.status === 'pendente').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((comprovantes.filter(c => c.status === 'completo').length / comprovantes.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de PODs</TabsTrigger>
          <TabsTrigger value="coleta">Coleta de POD</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle>Comprovantes de Entrega</CardTitle>
              <CardDescription>
                Gerencie os comprovantes de entrega digitais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredComprovantes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nenhum comprovante encontrado"
                  description="Não há comprovantes que correspondem aos filtros selecionados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead>Recebido Por</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Anexos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComprovantes.map((comprovante) => (
                      <TableRow key={comprovante.id}>
                        <TableCell className="font-medium">{comprovante.codigo}</TableCell>
                        <TableCell>{comprovante.cliente}</TableCell>
                        <TableCell>{comprovante.produto}</TableCell>
                        <TableCell>
                          {comprovante.dataEntrega 
                            ? new Date(comprovante.dataEntrega).toLocaleString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell>{comprovante.recebidoPor || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadges[comprovante.status as keyof typeof statusBadges].variant}>
                            {statusBadges[comprovante.status as keyof typeof statusBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {comprovante.assinatura && (
                              <Badge variant="outline" className="text-xs">
                                Assinatura
                              </Badge>
                            )}
                            {comprovante.fotos > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {comprovante.fotos} Fotos
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Comprovante de Entrega - {comprovante.codigo}</DialogTitle>
                                  <DialogDescription>
                                    Detalhes completos do comprovante de entrega
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Cliente:</strong> {comprovante.cliente}
                                    </div>
                                    <div>
                                      <strong>Produto:</strong> {comprovante.produto}
                                    </div>
                                    <div>
                                      <strong>Motorista:</strong> {comprovante.motorista}
                                    </div>
                                    <div>
                                      <strong>Veículo:</strong> {comprovante.veiculo}
                                    </div>
                                    <div>
                                      <strong>Local:</strong> {comprovante.localizacao}
                                    </div>
                                    <div>
                                      <strong>Data:</strong> {comprovante.dataEntrega 
                                        ? new Date(comprovante.dataEntrega).toLocaleString()
                                        : "Não entregue"
                                      }
                                    </div>
                                    {comprovante.recebidoPor && (
                                      <>
                                        <div>
                                          <strong>Recebido por:</strong> {comprovante.recebidoPor}
                                        </div>
                                        <div>
                                          <strong>Documento:</strong> {comprovante.documentoRecebedor}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {comprovante.observacoes && (
                                    <div>
                                      <strong>Observações:</strong>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {comprovante.observacoes}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4">
                                    {comprovante.assinatura && (
                                      <div className="text-center">
                                        <div className="w-32 h-20 bg-muted rounded border-2 border-dashed flex items-center justify-center text-xs">
                                          Assinatura Digital
                                        </div>
                                      </div>
                                    )}
                                    {comprovante.fotos > 0 && (
                                      <div className="text-center">
                                        <div className="w-32 h-20 bg-muted rounded border-2 border-dashed flex items-center justify-center text-xs">
                                          {comprovante.fotos} Fotos
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="coleta">
          <Card>
            <CardHeader>
              <CardTitle>Coleta de Comprovante</CardTitle>
              <CardDescription>
                Interface para coleta de assinatura e fotos no momento da entrega
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código da Entrega</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      {comprovantes.filter(c => c.status === 'pendente').map(c => (
                        <SelectItem key={c.id} value={c.codigo}>
                          {c.codigo} - {c.cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nome do Recebedor</label>
                  <Input placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-sm font-medium">Documento do Recebedor</label>
                  <Input placeholder="CPF ou RG" />
                </div>
                <div>
                  <label className="text-sm font-medium">Data/Hora da Entrega</label>
                  <Input type="datetime-local" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea 
                  placeholder="Observações sobre a entrega (condições do produto, local de descarga, etc.)"
                  className="mt-1"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Assinatura Digital</h3>
                  <div className="w-full h-48 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Área para captura de assinatura digital
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Fotos da Entrega</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Foto do Produto</p>
                      </div>
                    </div>
                    <div className="h-32 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Foto do Local</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Foto
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">Salvar Rascunho</Button>
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Comprovante
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}