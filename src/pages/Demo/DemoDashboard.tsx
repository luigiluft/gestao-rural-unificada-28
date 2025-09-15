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
import { EmptyState } from "@/components/ui/empty-state"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockData } from "@/data/mockData"
import { useTutorial } from "@/contexts/TutorialContext"

export default function DemoDashboard() {
  const navigate = useNavigate()
  const { isActive } = useTutorial()
  
  const stats = mockData.dashboardStats
  const recentMovements = mockData.recentMovements

  const handleNavigation = (route: string) => {
    if (isActive) {
      navigate(`/demo${route}`)
    } else {
      navigate(route)
    }
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Indicator */}
      {isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-amber-700 font-medium">MODO DEMONSTRAÇÃO</span>
            <span className="text-amber-600 text-sm">- Dados fictícios para tutorial</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={() => handleNavigation('/entradas')} className="bg-gradient-primary hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
          </Button>
          <Button variant="outline" onClick={() => handleNavigation('/saidas')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total em Estoque"
          value={stats.totalEstoque.toString()}
          description="itens cadastrados"
          icon={Package}
          variant="default"
        />
        <StatCard
          title="Produtos Ativos"
          value={stats.produtosAtivos.toString()}
          description="diferentes produtos"
          icon={PackageOpen}
          variant="success"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="valor do estoque"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Alertas"
          value={stats.alertas.toString()}
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
                        movement.tipo_movimentacao === 'entrada' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {movement.produtos?.nome} {movement.lote ? `- ${movement.lote}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.franquias?.nome}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={movement.tipo_movimentacao === 'entrada' ? 'default' : 'secondary'}>
                        {movement.tipo_movimentacao === 'entrada' ? '+' : '-'}{movement.quantidade}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(movement.data_movimentacao), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
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
              {stats.alertasDetalhes.map((alert) => (
                <div key={alert.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {alert.produtos.nome}
                    </span>
                    <span className="text-muted-foreground">
                      {alert.quantidade_atual} {alert.produtos.unidade_medida}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((alert.quantidade_atual / 100) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => handleNavigation('/estoque')}
              >
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
                onClick={() => handleNavigation('/entradas')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Entrada
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleNavigation('/saidas')}
              >
                <Package className="w-4 h-4 mr-2" />
                Registrar Saída
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleNavigation('/relatorios')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleNavigation('/estoque')}
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