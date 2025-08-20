import { useState } from "react"
import { 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useEstoque, useMovimentacoes } from "@/hooks/useEstoque"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"


export default function Estoque() {
  const navigate = useNavigate()
  const { data: estoque, isLoading } = useEstoque()
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const { data: movimentacoes } = useMovimentacoes(selectedItem?.produto_id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Crítico":
        return "destructive"
      case "Baixo":
        return "secondary"
      case "Normal":
        return "default"
      default:
        return "default"
    }
  }

  const getStockLevel = (quantidade: number, maximo: number = 1000) => {
    return Math.min((quantidade / maximo) * 100, 100)
  }

  const getStockStats = () => {
    if (!estoque) return { total: 0, normal: 0, baixo: 0, critico: 0 }
    
    const total = estoque.reduce((acc, item) => acc + item.quantidade_atual, 0)
    const normal = estoque.filter(item => item.quantidade_atual >= 100).length
    const baixo = estoque.filter(item => item.quantidade_atual < 100 && item.quantidade_atual >= 20).length
    const critico = estoque.filter(item => item.quantidade_atual < 20).length
    
    return { total, normal, baixo, critico }
  }

  const stats = getStockStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">
            Controle e monitore os produtos em estoque
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Normal</p>
                <p className="text-2xl font-bold text-success">{stats.normal}</p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-warning">{stats.baixo}</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Crítico</p>
                <p className="text-2xl font-bold text-destructive">{stats.critico}</p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, lote ou depósito..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <CardDescription>
            {estoque?.length || 0} produtos monitorados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : estoque && estoque.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoque.map((item) => {
                  const stockLevel = getStockLevel(item.quantidade_atual)
                  const status = item.quantidade_atual < 20 ? 'Crítico' : 
                                item.quantidade_atual < 100 ? 'Baixo' : 'Normal'
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.produtos?.nome}</p>
                            <p className="text-sm text-muted-foreground">ID: {item.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.lote || 'N/A'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.quantidade_atual} {item.produtos?.unidade_medida}</p>
                          <p className="text-xs text-muted-foreground">
                            Disponível: {item.quantidade_disponivel || item.quantidade_atual}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={stockLevel} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(stockLevel)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{(item as any).franquias?.nome}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(status) as any}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.valor_medio && item.quantidade_atual
                          ? `R$ ${(item.valor_medio * item.quantidade_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Produto</DialogTitle>
                                <DialogDescription>
                                  Informações completas e histórico de movimentações
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedItem && (
                                <Tabs defaultValue="details" className="w-full">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                                    <TabsTrigger value="history">Histórico</TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="details" className="space-y-4">
                                    <div className="grid gap-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium">Produto</h4>
                                          <p className="text-muted-foreground">{selectedItem.produtos?.nome}</p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Lote</h4>
                                          <p className="text-muted-foreground">{selectedItem.lote || 'N/A'}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <h4 className="font-medium">Quantidade Atual</h4>
                                          <p className="text-muted-foreground">
                                            {selectedItem.quantidade_atual} {selectedItem.produtos?.unidade_medida}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Disponível</h4>
                                          <p className="text-muted-foreground">
                                            {selectedItem.quantidade_disponivel || selectedItem.quantidade_atual} {selectedItem.produtos?.unidade_medida}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Reservado</h4>
                                          <p className="text-muted-foreground">
                                            {selectedItem.quantidade_reservada} {selectedItem.produtos?.unidade_medida}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium">Franquia</h4>
                                          <p className="text-muted-foreground">{selectedItem.franquias?.nome}</p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Valor Médio</h4>
                                          <p className="text-muted-foreground">
                                            {selectedItem.valor_medio 
                                              ? `R$ ${selectedItem.valor_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                              : 'N/A'
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      {selectedItem.data_validade && (
                                        <div>
                                          <h4 className="font-medium">Validade</h4>
                                          <p className="text-muted-foreground">
                                            {new Date(selectedItem.data_validade).toLocaleDateString('pt-BR')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="history" className="space-y-4">
                                    <div className="space-y-3">
                                      {movimentacoes && movimentacoes.length > 0 ? (
                                        movimentacoes.map((mov) => (
                                          <div key={mov.id} className="flex items-center gap-3 p-3 rounded-lg border">
                                            <div className={`p-2 rounded-full ${
                                              mov.tipo_movimentacao === 'entrada' 
                                                ? 'bg-success/10 text-success' 
                                                : 'bg-warning/10 text-warning'
                                            }`}>
                                              <History className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-medium">
                                                {mov.tipo_movimentacao === 'entrada' ? 'Entrada' : 'Saída'} - {mov.quantidade}
                                              </p>
                                              <p className="text-sm text-muted-foreground">{(mov as any).franquias?.nome}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(mov.data_movimentacao), { 
                                                  addSuffix: true, 
                                                  locale: ptBR 
                                                })}
                                              </p>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <EmptyState
                                          icon={<History className="w-8 h-8 text-muted-foreground" />}
                                          title="Nenhuma movimentação"
                                          description="Ainda não há movimentações para este produto."
                                        />
                                      )}
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<Package className="w-8 h-8 text-muted-foreground" />}
              title="Nenhum produto em estoque"
              description="Registre entradas de produtos para começar a controlar seu estoque."
              action={{
                label: "Registrar Primeira Entrada",
                onClick: () => navigate('/entradas')
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}