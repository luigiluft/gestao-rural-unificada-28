import { 
  Package, 
  PackageOpen, 
  TrendingUp, 
  AlertTriangle, 
  Plus,
  ArrowUpRight,
  Calendar,
  BarChart3
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useNavigate } from "react-router-dom"

const recentMovements = [
  {
    id: 1,
    type: "entrada",
    product: "Milho - Lote MIL001",
    quantity: "500 sacas",
    time: "há 2 horas",
    origin: "Fornecedor ABC"
  },
  {
    id: 2,
    type: "saida",
    product: "Soja - Lote SOJ035",
    quantity: "200 sacas",
    time: "há 4 horas",
    destination: "Cliente XYZ"
  },
  {
    id: 3,
    type: "entrada",
    product: "Fertilizante NPK",
    quantity: "100 kg",
    time: "ontem",
    origin: "Cooperativa"
  }
]

const lowStockAlerts = [
  { product: "Adubo Orgânico", current: 50, minimum: 100, unit: "kg" },
  { product: "Sementes de Girassol", current: 15, minimum: 30, unit: "kg" },
  { product: "Defensivo ABC", current: 8, minimum: 20, unit: "litros" }
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das operações - {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/entradas')} className="bg-gradient-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
          </Button>
          <Button variant="outline" onClick={() => navigate('/saidas')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total em Estoque"
          value="1.247"
          description="itens cadastrados"
          icon={Package}
          trend={{ value: 5.2, label: "vs mês anterior" }}
          variant="default"
        />
        <StatCard
          title="Produtos Ativos"
          value="89"
          description="diferentes produtos"
          icon={PackageOpen}
          trend={{ value: 2.1, label: "novos este mês" }}
          variant="success"
        />
        <StatCard
          title="Valor Total"
          value="R$ 485.340"
          description="valor do estoque"
          icon={TrendingUp}
          trend={{ value: 8.7, label: "crescimento" }}
          variant="success"
        />
        <StatCard
          title="Alertas"
          value="3"
          description="produtos com estoque baixo"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Movements */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Movimentações Recentes
                  </CardTitle>
                  <CardDescription>
                    Últimas entradas e saídas do estoque
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'entrada' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{movement.product}</p>
                        <p className="text-sm text-muted-foreground">
                          {movement.type === 'entrada' ? movement.origin : movement.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={movement.type === 'entrada' ? 'default' : 'secondary'}>
                        {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{movement.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="space-y-6">
          {/* Stock Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Estoque Baixo
              </CardTitle>
              <CardDescription>
                Produtos que precisam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockAlerts.map((alert, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{alert.product}</span>
                    <span className="text-muted-foreground">
                      {alert.current}/{alert.minimum} {alert.unit}
                    </span>
                  </div>
                  <Progress 
                    value={(alert.current / alert.minimum) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-4">
                Ver todos os alertas
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/entradas')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Entrada
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/saidas')}
              >
                <Package className="w-4 h-4 mr-2" />
                Registrar Saída
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/relatorios')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/estoque')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Consultar Estoque
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}