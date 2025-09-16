import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Package, CheckCircle, Clock, MapPin } from "lucide-react"
import { useTutorial } from "@/contexts/TutorialContext"

const StatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'em_transito':
        return 'secondary'
      case 'chegou_deposito':
        return 'outline'
      case 'em_descarga':
        return 'default'
      case 'conferencia':
        return 'secondary'
      case 'armazenado':
        return 'default'
      default:
        return 'outline'
    }
  }

  const getLabel = (status: string) => {
    switch (status) {
      case 'em_transito':
        return 'Em Trânsito'
      case 'chegou_deposito':
        return 'Chegou ao Depósito'
      case 'em_descarga':
        return 'Em Descarga'
      case 'conferencia':
        return 'Em Conferência'
      case 'armazenado':
        return 'Armazenado'
      default:
        return status
    }
  }

  return <Badge variant={getVariant(status)}>{getLabel(status)}</Badge>
}

export default function DemoRecebimento() {
  const { handleTargetClick } = useTutorial()
  const [currentStatus, setCurrentStatus] = useState('em_transito')

  const statusFlow = [
    { id: 'em_transito', label: 'Em Trânsito', icon: Truck, description: 'Mercadoria saiu do fornecedor' },
    { id: 'chegou_deposito', label: 'Chegou ao Depósito', icon: MapPin, description: 'Caminhão chegou ao depósito' },
    { id: 'em_descarga', label: 'Em Descarga', icon: Package, description: 'Mercadoria sendo descarregada' },
    { id: 'conferencia', label: 'Em Conferência', icon: Clock, description: 'Conferindo itens recebidos' },
    { id: 'armazenado', label: 'Armazenado', icon: CheckCircle, description: 'Mercadoria armazenada com sucesso' }
  ]

  const currentIndex = statusFlow.findIndex(s => s.id === currentStatus)

  const handleNextStatus = () => {
    if (currentIndex < statusFlow.length - 1) {
      setCurrentStatus(statusFlow[currentIndex + 1].id)
    }
  }

  const mockRecebimento = {
    id: 'REC001',
    nfe: '12345',
    fornecedor: 'Fornecedor ABC Ltda',
    data_prevista: '2024-09-16',
    data_chegada: '2024-09-16 14:30',
    motorista: 'João Silva',
    placa: 'ABC-1234',
    valor_total: 'R$ 15.250,00',
    produtos: [
      { nome: 'Soja em Grãos Premium', quantidade: 500, unidade: 'SC' },
      { nome: 'Milho Amarelo', quantidade: 800, unidade: 'SC' },
      { nome: 'Feijão Carioca', quantidade: 250, unidade: 'SC' },
      { nome: 'Fertilizante NPK', quantidade: 100, unidade: 'KG' },
      { nome: 'Defensivo Herbicida', quantidade: 20, unidade: 'L' }
    ]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recebimento - {mockRecebimento.id}</h1>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Informações do Recebimento */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Entrega</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">NFe</span>
            <p className="font-medium">{mockRecebimento.nfe}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Fornecedor</span>
            <p className="font-medium">{mockRecebimento.fornecedor}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Motorista</span>
            <p className="font-medium">{mockRecebimento.motorista}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Placa</span>
            <p className="font-medium">{mockRecebimento.placa}</p>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Status */}
      <Card data-tutorial="fluxo-status">
        <CardHeader>
          <CardTitle>Fluxo de Recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusFlow.map((status, index) => {
              const Icon = status.icon
              const isActive = index === currentIndex
              const isCompleted = index < currentIndex
              const isNext = index === currentIndex + 1

              return (
                <div 
                  key={status.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                    isActive 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : isCompleted 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-muted bg-muted/20'
                  }`}
                >
                  <Icon 
                    className={`h-6 w-6 ${
                      isActive 
                        ? 'text-primary' 
                        : isCompleted 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      isActive ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-foreground'
                    }`}>
                      {status.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{status.description}</p>
                  </div>
                  {isNext && (
                    <Button 
                      onClick={handleNextStatus}
                      data-tutorial="proximo-status-btn"
                      size="sm"
                      className="ml-auto"
                    >
                      Avançar Status
                    </Button>
                  )}
                  {isActive && index === currentIndex && index > 0 && (
                    <Badge variant="outline" className="ml-auto">Em Andamento</Badge>
                  )}
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos da Entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockRecebimento.produtos.map((produto, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="font-medium">{produto.nome}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {produto.quantidade} {produto.unidade}
                  </span>
                </div>
                <Badge variant="outline">A conferir</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão de conclusão do tutorial */}
      {currentStatus === 'armazenado' && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-medium text-green-800">Recebimento Concluído!</h3>
              <p className="text-green-700">
                A mercadoria foi recebida e armazenada com sucesso. Agora você pode prosseguir para a próxima etapa do tutorial.
              </p>
              <Button 
                onClick={() => {
                  const btn = document.querySelector('[data-tutorial="continuar-tutorial-btn"]')
                  if (btn) handleTargetClick(btn as Element)
                }}
                data-tutorial="continuar-tutorial-btn"
                className="bg-green-600 hover:bg-green-700"
              >
                Continuar Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}