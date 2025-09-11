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
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom"
import { useDashboardStats, useRecentMovements } from "@/hooks/useDashboard"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentMovements, isLoading: movementsLoading } = useRecentMovements()

  return (
    <div className="space-y-6">
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
          <Button onClick={() => navigate('/entradas')} className="bg-gradient-primary hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
          </Button>
          <Button variant="outline" onClick={() => navigate('/saidas')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total em Estoque"
              value={stats?.totalEstoque.toString() || "0"}
              description="itens cadastrados"
              icon={Package}
              variant="default"
            />
            <StatCard
              title="Produtos Ativos"
              value={stats?.produtosAtivos.toString() || "0"}
              description="diferentes produtos"
              icon={PackageOpen}
              variant="success"
            />
            <StatCard
              title="Valor Total"
              value={`R$ ${stats?.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
              description="valor do estoque"
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Alertas"
              value={stats?.alertas.toString() || "0"}
              description="produtos com estoque baixo"
              icon={AlertTriangle}
              variant="warning"
            />
          </>
        )}
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
              {movementsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentMovements && recentMovements.length > 0 ? (
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
                            {(movement as any).franquias?.nome}
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
              ) : (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-muted-foreground" />}
                  title="Nenhuma movimentação encontrada"
                  description="Quando você registrar entradas ou saídas, elas aparecerão aqui."
                  action={{
                    label: "Registrar Entrada",
                    onClick: () => navigate('/entradas')
                  }}
                />
              )}
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
              {statsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.alertasDetalhes && stats.alertasDetalhes.length > 0 ? (
                <>
                  {stats.alertasDetalhes.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {(() => {
                            const produtos = typeof alert.produtos === 'string' ? JSON.parse(alert.produtos) : alert.produtos;
                            return produtos?.nome || 'Produto';
                          })()}
                        </span>
                        <span className="text-muted-foreground">
                          {alert.quantidade_atual} {(() => {
                            const produtos = typeof alert.produtos === 'string' ? JSON.parse(alert.produtos) : alert.produtos;
                            return produtos?.unidade_medida || 'UN';
                          })()}
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
                    onClick={() => navigate('/estoque')}
                  >
                    Ver todos os alertas
                  </Button>
                </>
              ) : (
                <EmptyState
                  icon={<AlertTriangle className="w-8 h-8 text-muted-foreground" />}
                  title="Nenhum alerta de estoque"
                  description="Todos os produtos estão com estoque adequado."
                />
              )}
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