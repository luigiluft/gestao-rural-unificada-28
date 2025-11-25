import { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, CheckCircle, Clock, BarChart3, Eye, History } from "lucide-react";
import { DepositoFilter } from "@/components/ui/deposito-filter";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEstoque, useMovimentacoes } from "@/hooks/useEstoque";
import { useUpdateNotificationView } from "@/hooks/useNotificationViews";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import AvariasTab from "@/components/Estoque/AvariasTab";
export default function Estoque() {
  const navigate = useNavigate();
  const { isProdutor } = useUserRole();
  const {
    data: estoque,
    isLoading
  } = useEstoque();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: movimentacoes
  } = useMovimentacoes(selectedItem?.produto_id);
  const updateNotificationView = useUpdateNotificationView();

  // Reset estoque notification when page loads
  useEffect(() => {
    updateNotificationView.mutate("estoque");
  }, []); // Only run once when component mounts

  // Filter estoque based on search term
  const filteredEstoque = estoque?.filter(item => {
    const produto = item.produtos?.nome || ""
    const lote = item.lote || ""
    const codigo = item.produtos?.codigo || ""
    const deposito = (item as any).franquias?.nome || ""
    
    const searchLower = searchTerm.toLowerCase()
    return (
      produto.toLowerCase().includes(searchLower) ||
      lote.toLowerCase().includes(searchLower) ||
      codigo.toLowerCase().includes(searchLower) ||
      deposito.toLowerCase().includes(searchLower)
    )
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Crítico":
        return "destructive";
      case "Baixo":
        return "secondary";
      case "Normal":
        return "default";
      default:
        return "default";
    }
  };
  const getStockLevel = (quantidade: number, maximo: number = 1000) => {
    return Math.min(quantidade / maximo * 100, 100);
  };
  const getStockStats = () => {
    if (!filteredEstoque) return {
      total: 0,
      normal: 0,
      baixo: 0,
      critico: 0,
      valorTotal: 0
    };
    const total = filteredEstoque.reduce((acc, item) => acc + item.quantidade_atual, 0);
    const normal = filteredEstoque.filter(item => item.quantidade_atual >= 100).length;
    const baixo = filteredEstoque.filter(item => item.quantidade_atual < 100 && item.quantidade_atual >= 20).length;
    const critico = filteredEstoque.filter(item => item.quantidade_atual < 20).length;
    const valorTotal = filteredEstoque.reduce((acc, item) => acc + (item.valor_total || 0), 0);
    return {
      total,
      normal,
      baixo,
      critico,
      valorTotal
    };
  };
  const stats = getStockStats();
  return <div className="space-y-6">
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

      {/* Stock Table with Tabs */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Controle de Estoque</CardTitle>
          <CardDescription>
            Gerencie produtos em estoque e produtos avariados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="estoque" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="estoque">Produtos em Estoque</TabsTrigger>
              <TabsTrigger value="avarias">Produtos Avariados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="estoque" className="space-y-4">
              {/* Summary Cards inside Stock Tab */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estoque Total</p>
                        <p className="text-2xl font-bold">{stats.total.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Pallets</p>
                        <p className="text-2xl font-bold text-success">{stats.normal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-bold">
                          R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Search bar and deposit filter */}
              <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por produto, lote, código ou depósito..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {isProdutor && <DepositoFilter />}
              </div>
              
              {isLoading ? <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div> : filteredEstoque && filteredEstoque.length > 0 ? <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Depósito</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstoque.map(item => {
                    const stockLevel = getStockLevel(item.quantidade_atual);
                    const status = item.quantidade_atual < 20 ? 'Crítico' : item.quantidade_atual < 100 ? 'Baixo' : 'Normal';
                    return <TableRow key={`${item.produto_id}-${item.lote || 'no-lote'}`} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Package className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{item.produtos?.nome}</p>
                                  <p className="text-sm text-muted-foreground">Código: {item.produtos?.codigo || 'N/A'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.lote || 'N/A'}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.quantidade_atual} {item.produtos?.unidade_medida}</p>
                              </div>
                            </TableCell>
                            <TableCell>{(item as any).franquias?.nome}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(status) as any}>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.valor_total ? `R$ ${item.valor_total.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2
                        })}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
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
                                    
                                    {selectedItem && <Tabs defaultValue="details" className="w-full">
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
                                                <h4 className="font-medium">Valor Unitário</h4>
                                                <p className="text-muted-foreground">
                                                  R$ {selectedItem.valor_unitario?.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2
                                          })}
                                                </p>
                                              </div>
                                              <div>
                                                <h4 className="font-medium">Depósito</h4>
                                                <p className="text-muted-foreground">
                                                  {selectedItem.franquias?.nome || 'N/A'}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <h4 className="font-medium">Código do Produto</h4>
                                                <p className="text-muted-foreground">{selectedItem.produtos?.codigo || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <h4 className="font-medium">Valor Total</h4>
                                                <p className="text-muted-foreground">
                                                  {selectedItem.valor_total ? `R$ ${selectedItem.valor_total.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2
                                          })}` : 'N/A'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="history" className="space-y-4">
                                          <div className="space-y-3">
                                            {movimentacoes && movimentacoes.length > 0 ? movimentacoes.map(mov => <div key={mov.id} className="flex items-center gap-3 p-3 rounded-lg border">
                                                  <div className={`p-2 rounded-full ${mov.tipo_movimentacao === 'entrada' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
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
                                                </div>) : <EmptyState icon={<History className="w-8 h-8 text-muted-foreground" />} title="Nenhuma movimentação" description="Ainda não há movimentações para este produto." />}
                                          </div>
                                        </TabsContent>
                                      </Tabs>}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>;
                  })}
                    </TableBody>
                  </Table>
                </div> : <EmptyState 
                  icon={<Package className="w-8 h-8 text-muted-foreground" />} 
                  title="Nenhum produto em estoque" 
                  description={searchTerm ? "Nenhum produto encontrado com os critérios de busca." : "Registre entradas de produtos para começar a controlar seu estoque."} 
                  action={!searchTerm ? {
                    label: "Registrar Primeira Entrada",
                    onClick: () => navigate('/entradas')
                  } : undefined}
                />}
            </TabsContent>

            <TabsContent value="avarias" className="space-y-4">
              <AvariasTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
}