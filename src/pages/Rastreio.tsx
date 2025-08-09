import { useState } from "react"
import { 
  Search, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  AlertCircle,
  Navigation
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const pedidos = [
  {
    id: "PED001",
    cliente: "Cliente Premium Ltda",
    produto: "Milho Híbrido - 200 sacas",
    status: "Em Transporte",
    dataExpedicao: "2024-08-09",
    previsaoEntrega: "2024-08-12",
    transportadora: "Transportes ABC",
    rastreamento: "TR123456789BR"
  },
  {
    id: "PED002",
    cliente: "Fazenda Vista Alegre",
    produto: "Fertilizante NPK - 500 kg",
    status: "Preparando",
    dataExpedicao: null,
    previsaoEntrega: "2024-08-11",
    transportadora: "Retirada Própria",
    rastreamento: null
  },
  {
    id: "PED003",
    cliente: "Cooperativa XYZ",
    produto: "Soja Premium - 150 sacas",
    status: "Entregue",
    dataExpedicao: "2024-08-07",
    previsaoEntrega: "2024-08-09",
    transportadora: "Logística Rural",
    rastreamento: "LR987654321BR"
  }
]

const statusSteps = [
  { id: 1, name: "Confirmado", icon: CheckCircle },
  { id: 2, name: "Em Separação", icon: Package },
  { id: 3, name: "Expedido", icon: Truck },
  { id: 4, name: "Em Transporte", icon: Navigation },
  { id: 5, name: "Entregue", icon: CheckCircle }
]

const getStatusStep = (status: string) => {
  switch (status) {
    case "Confirmado": return 1
    case "Preparando": return 2
    case "Expedido": return 3
    case "Em Transporte": return 4
    case "Entregue": return 5
    default: return 1
  }
}

export default function Rastreio() {
  const [selectedPedido, setSelectedPedido] = useState(pedidos[0])

  const currentStep = getStatusStep(selectedPedido.status)

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed"
    if (stepId === currentStep) return "current"
    return "pending"
  }

  const getStepClasses = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground"
      case "current":
        return "bg-primary text-primary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rastreamento</h1>
          <p className="text-muted-foreground">
            Acompanhe o status dos pedidos e entregas
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número do pedido, cliente ou código de rastreamento..."
                className="pl-9"
              />
            </div>
            <Select value={selectedPedido.id} onValueChange={(value) => {
              const pedido = pedidos.find(p => p.id === value)
              if (pedido) setSelectedPedido(pedido)
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione um pedido" />
              </SelectTrigger>
              <SelectContent>
                {pedidos.map((pedido) => (
                  <SelectItem key={pedido.id} value={pedido.id}>
                    {pedido.id} - {pedido.cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Status do Pedido {selectedPedido.id}
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso da entrega em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Status Timeline */}
                <div className="relative">
                  <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const status = getStepStatus(step.id)
                      const Icon = step.icon
                      
                      return (
                        <div key={step.id} className="relative flex items-center gap-4">
                          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${getStepClasses(status)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-medium ${status === 'current' ? 'text-primary' : status === 'completed' ? 'text-success' : 'text-muted-foreground'}`}>
                              {step.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {status === 'completed' && index < 3 && "Concluído"}
                              {status === 'current' && "Em andamento"}
                              {status === 'pending' && "Aguardando"}
                            </p>
                          </div>
                          <div className="text-right">
                            {status === 'completed' && (
                              <p className="text-sm text-muted-foreground">
                                {index === 0 ? "09/08 - 09:00" :
                                 index === 1 ? "09/08 - 14:30" :
                                 index === 2 ? "09/08 - 16:45" : 
                                 "09/08 - 18:20"}
                              </p>
                            )}
                            {status === 'current' && (
                              <Badge variant="outline">Agora</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mapa Placeholder */}
                <div className="mt-8">
                  <h3 className="font-medium mb-4">Localização Atual</h3>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Mapa de rastreamento em tempo real</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Última atualização: Rodovia BR-153, KM 342 - São Paulo/SP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pedido Details */}
        <div className="space-y-6">
          {/* Pedido Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Detalhes do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Cliente</h4>
                <p className="font-medium">{selectedPedido.cliente}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Produto</h4>
                <p>{selectedPedido.produto}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Status Atual</h4>
                <Badge variant={selectedPedido.status === 'Entregue' ? 'default' : 'secondary'}>
                  {selectedPedido.status}
                </Badge>
              </div>

              {selectedPedido.dataExpedicao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Data de Expedição</h4>
                  <p>{new Date(selectedPedido.dataExpedicao).toLocaleDateString('pt-BR')}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Previsão de Entrega</h4>
                <p>{new Date(selectedPedido.previsaoEntrega).toLocaleDateString('pt-BR')}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Transportadora</h4>
                <p>{selectedPedido.transportadora}</p>
              </div>

              {selectedPedido.rastreamento && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Código de Rastreamento</h4>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {selectedPedido.rastreamento}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Atualizar Status
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="w-4 h-4 mr-2" />
                Reportar Problema
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Histórico Completo
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de Pedidos</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Em Transporte</span>
                <span className="font-medium text-warning">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Entregues Este Mês</span>
                <span className="font-medium text-success">98</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa de Entrega</span>
                <span className="font-medium">97.8%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}