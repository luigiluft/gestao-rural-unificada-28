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

const estoque = [
  {
    id: "EST001",
    produto: "Milho Híbrido",
    lote: "MIL001",
    quantidade: 450,
    minimo: 100,
    maximo: 1000,
    unidade: "sacas",
    deposito: "Armazém A",
    status: "Normal",
    validade: "2025-03-15",
    valor: "R$ 40.500,00",
    ultimaMovimentacao: "2024-08-09"
  },
  {
    id: "EST002",
    produto: "Fertilizante NPK",
    lote: "NPK123",
    quantidade: 50,
    minimo: 100,
    maximo: 500,
    unidade: "kg",
    deposito: "Armazém B",
    status: "Baixo",
    validade: "2025-12-30",
    valor: "R$ 2.125,00",
    ultimaMovimentacao: "2024-08-08"
  },
  {
    id: "EST003",
    produto: "Soja Premium",
    lote: "SOJ045",
    quantidade: 800,
    minimo: 200,
    maximo: 1200,
    unidade: "sacas",
    deposito: "Armazém A",
    status: "Normal",
    validade: "2025-06-20",
    valor: "R$ 140.800,00",
    ultimaMovimentacao: "2024-08-07"
  },
  {
    id: "EST004",
    produto: "Defensivo ABC",
    lote: "DEF789",
    quantidade: 15,
    minimo: 20,
    maximo: 100,
    unidade: "litros",
    deposito: "Depósito Campo",
    status: "Crítico",
    validade: "2024-11-30",
    valor: "R$ 1.875,00",
    ultimaMovimentacao: "2024-08-06"
  }
]

const movimentacoes = [
  {
    data: "2024-08-09",
    tipo: "Entrada",
    quantidade: "+50 sacas",
    origem: "Compra - Cooperativa ABC",
    responsavel: "João Silva"
  },
  {
    data: "2024-08-05",
    tipo: "Saída",
    quantidade: "-100 sacas",
    origem: "Venda - Cliente XYZ",
    responsavel: "Maria Santos"
  },
  {
    data: "2024-08-01",
    tipo: "Entrada",
    quantidade: "+500 sacas",
    origem: "Produção própria",
    responsavel: "Pedro Costa"
  }
]

export default function Estoque() {
  const [selectedItem, setSelectedItem] = useState<typeof estoque[0] | null>(null)

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

  const getStockLevel = (quantidade: number, minimo: number, maximo: number) => {
    return (quantidade / maximo) * 100
  }

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
                <p className="text-2xl font-bold">1.315</p>
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
                <p className="text-2xl font-bold text-success">2</p>
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
                <p className="text-2xl font-bold text-warning">1</p>
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
                <p className="text-2xl font-bold text-destructive">1</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estoque.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.produto}</p>
                        <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.lote}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.quantidade} {item.unidade}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.minimo} | Max: {item.maximo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress 
                        value={getStockLevel(item.quantidade, item.minimo, item.maximo)} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(getStockLevel(item.quantidade, item.minimo, item.maximo))}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{item.deposito}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status) as any}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.validade).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium">{item.valor}</TableCell>
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
                                      <p className="text-muted-foreground">{selectedItem.produto}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Lote</h4>
                                      <p className="text-muted-foreground">{selectedItem.lote}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <h4 className="font-medium">Quantidade Atual</h4>
                                      <p className="text-muted-foreground">{selectedItem.quantidade} {selectedItem.unidade}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Estoque Mínimo</h4>
                                      <p className="text-muted-foreground">{selectedItem.minimo} {selectedItem.unidade}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Estoque Máximo</h4>
                                      <p className="text-muted-foreground">{selectedItem.maximo} {selectedItem.unidade}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium">Depósito</h4>
                                      <p className="text-muted-foreground">{selectedItem.deposito}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Validade</h4>
                                      <p className="text-muted-foreground">
                                        {new Date(selectedItem.validade).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium">Valor Total</h4>
                                    <p className="text-muted-foreground">{selectedItem.valor}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="history" className="space-y-4">
                                <div className="space-y-3">
                                  {movimentacoes.map((mov, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                                      <div className={`p-2 rounded-full ${
                                        mov.tipo === 'Entrada' 
                                          ? 'bg-success/10 text-success' 
                                          : 'bg-warning/10 text-warning'
                                      }`}>
                                        <History className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">{mov.tipo} - {mov.quantidade}</p>
                                        <p className="text-sm text-muted-foreground">{mov.origem}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(mov.data).toLocaleDateString('pt-BR')} • {mov.responsavel}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}