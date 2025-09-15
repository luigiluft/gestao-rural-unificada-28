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
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockData } from "@/data/mockData"
import { useTutorial } from "@/contexts/TutorialContext"

export default function DemoEstoque() {
  const navigate = useNavigate()
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const { isActive } = useTutorial()
  
  const estoque = mockData.estoque

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

  const getStockLevel = (quantidade: number, maximo: number = 100) => {
    return Math.min((quantidade / maximo) * 100, 100)
  }

  const getStockStats = () => {
    const total = estoque.reduce((acc, item) => acc + item.quantidade_atual, 0)
    const normal = estoque.filter(item => item.quantidade_atual >= 100).length
    const baixo = estoque.filter(item => item.quantidade_atual < 100 && item.quantidade_atual >= 20).length
    const critico = estoque.filter(item => item.quantidade_atual < 20).length
    
    return { total, normal, baixo, critico }
  }

  const stats = getStockStats()

  const getMovimentacoes = (produtoId: string) => {
    return mockData.movimentacoesPorProduto[produtoId] || []
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
            {estoque.length} produtos monitorados
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableCell>{item.lotes?.[0] || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.quantidade_atual} {item.produtos?.unidade_medida}</p>
                        <p className="text-xs text-muted-foreground">
                          Disponível: {item.quantidade_disponivel}
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
                    <TableCell>{item.franquias?.nome}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(status) as any}>
                        {status}
                      </Badge>
                    </TableCell>
                     <TableCell className="font-medium">
                       {`R$ ${item.valor_total_estoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
                                        <p className="text-muted-foreground">{selectedItem.lotes?.[0] || 'N/A'}</p>
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
                                          {selectedItem.quantidade_disponivel} {selectedItem.produtos?.unidade_medida}
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
                                         <h4 className="font-medium">Valor Total</h4>
                                         <p className="text-muted-foreground">
                                           {`R$ ${selectedItem.valor_total_estoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
                                    {getMovimentacoes(selectedItem.produto_id).length > 0 ? (
                                      getMovimentacoes(selectedItem.produto_id).map((mov) => (
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
                                            <p className="text-sm text-muted-foreground">{mov.franquias?.nome}</p>
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
        </CardContent>
      </Card>
    </div>
  )
}