import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Package, 
  Scan, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Search,
  Play,
  Square
} from "lucide-react"
import { 
  useInventarios, 
  useInventario,
  useInventarioPosicoes,
  useInventarioItens,
  useCriarInventario,
  useAtualizarInventario,
  useIniciarPosicao,
  useAdicionarItem,
  useConcluirPosicao
} from "@/hooks/useInventarios"
import { useStoragePositions } from "@/hooks/useStoragePositions"
import { useDepositosDisponiveis } from "@/hooks/useDepositosDisponiveis"
import { format } from "date-fns"

export default function Inventario() {
  const [selectedInventario, setSelectedInventario] = useState<string | null>(null)
  const [selectedPosicao, setSelectedPosicao] = useState<string | null>(null)
  const [novoInventarioOpen, setNovoInventarioOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedDeposito, setSelectedDeposito] = useState<string>("")
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState("")
  const [scannerData, setScannerData] = useState({
    codigo_barras: "",
    quantidade: 1,
    lote: "",
    observacoes: ""
  })

  const { data: inventarios, isLoading: loadingInventarios } = useInventarios()
  const { data: inventarioAtual } = useInventario(selectedInventario || undefined)
  const { data: posicoes } = useInventarioPosicoes(selectedInventario || undefined)
  const { data: itens } = useInventarioItens(selectedInventario || undefined, selectedPosicao || undefined)
  const { data: todasPosicoes } = useStoragePositions(selectedDeposito)
  const { data: depositos } = useDepositosDisponiveis()
  
  const criarInventario = useCriarInventario()
  const atualizarInventario = useAtualizarInventario()
  const iniciarPosicao = useIniciarPosicao()
  const adicionarItem = useAdicionarItem()
  const concluirPosicao = useConcluirPosicao()

  useEffect(() => {
    document.title = "Inventário - AgroHub"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie inventários e conferências de estoque no AgroHub')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'iniciado': { label: 'Iniciado', variant: 'secondary' as const, icon: Clock },
      'em_andamento': { label: 'Em Andamento', variant: 'default' as const, icon: Play },
      'concluido': { label: 'Concluído', variant: 'outline' as const, icon: CheckCircle },
      'cancelado': { label: 'Cancelado', variant: 'destructive' as const, icon: Square }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleCriarInventario = async () => {
    if (!selectedDeposito || selectedPosicoes.length === 0) return

    await criarInventario.mutateAsync({
      deposito_id: selectedDeposito,
      observacoes,
      posicoes_ids: selectedPosicoes
    })

    setNovoInventarioOpen(false)
    setSelectedDeposito("")
    setSelectedPosicoes([])
    setObservacoes("")
  }

  const handleIniciarPosicao = async (posicaoId: string) => {
    if (!selectedInventario) return

    await iniciarPosicao.mutateAsync({
      inventarioId: selectedInventario,
      posicaoId
    })

    setSelectedPosicao(posicaoId)
    setScannerOpen(true)
  }

  const handleScanSuccess = async (codigo: string) => {
    if (!selectedInventario || !selectedPosicao) return

    await adicionarItem.mutateAsync({
      inventario_id: selectedInventario,
      posicao_id: selectedPosicao,
      codigo_barras: codigo,
      quantidade_encontrada: scannerData.quantidade,
      lote: scannerData.lote,
      observacoes: scannerData.observacoes
    })

    // Reset scanner data
    setScannerData({
      codigo_barras: "",
      quantidade: 1,
      lote: "",
      observacoes: ""
    })
  }

  const handleConcluirPosicao = async (posicaoId: string) => {
    if (!selectedInventario) return

    await concluirPosicao.mutateAsync({
      inventarioId: selectedInventario,
      posicaoId
    })

    setSelectedPosicao(null)
    setScannerOpen(false)
  }

  const calcularProgresso = () => {
    if (!inventarioAtual) return 0
    if (inventarioAtual.total_posicoes === 0) return 0
    return Math.round((inventarioAtual.posicoes_conferidas / inventarioAtual.total_posicoes) * 100)
  }

  if (loadingInventarios) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventário</h1>
          <p className="text-muted-foreground">
            Gerencie conferências de estoque e controle de inventários
          </p>
        </div>

        <Dialog open={novoInventarioOpen} onOpenChange={setNovoInventarioOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Inventário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Inventário</DialogTitle>
              <DialogDescription>
                Selecione o depósito e as posições que serão inventariadas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="deposito">Depósito</Label>
                <Select value={selectedDeposito} onValueChange={setSelectedDeposito}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositos?.map((deposito) => (
                      <SelectItem key={deposito.deposito_id} value={deposito.deposito_id}>
                        {deposito.deposito_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDeposito && (
                <div>
                  <Label>Posições ({selectedPosicoes.length} selecionadas)</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                    {todasPosicoes?.map((posicao) => (
                      <div key={posicao.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={posicao.id}
                          checked={selectedPosicoes.includes(posicao.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPosicoes([...selectedPosicoes, posicao.id])
                            } else {
                              setSelectedPosicoes(selectedPosicoes.filter(id => id !== posicao.id))
                            }
                          }}
                        />
                        <Label htmlFor={posicao.id} className="text-sm">
                          {posicao.codigo} - {posicao.descricao || posicao.tipo_posicao}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre este inventário..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNovoInventarioOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCriarInventario}
                disabled={!selectedDeposito || selectedPosicoes.length === 0 || criarInventario.isPending}
              >
                {criarInventario.isPending ? "Criando..." : "Criar Inventário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card className="shadow-card border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-700">{inventarios?.length || 0}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Em Andamento</p>
                <p className="text-2xl font-bold text-amber-700">
                  {inventarios?.filter(i => i.status === 'em_andamento').length || 0}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Concluídos</p>
                <p className="text-2xl font-bold text-green-700">
                  {inventarios?.filter(i => i.status === 'concluido').length || 0}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Cancelados</p>
                <p className="text-2xl font-bold text-red-700">
                  {inventarios?.filter(i => i.status === 'cancelado').length || 0}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Square className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Lista de Inventários */}
        <div className="lg:col-span-1">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventários
              </CardTitle>
              <CardDescription>
                Selecione um inventário para gerenciar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventarios?.length === 0 ? (
                <EmptyState
                  title="Nenhum inventário"
                  description="Crie seu primeiro inventário para começar a conferir o estoque"
                />
              ) : (
                <div className="space-y-3">
                  {inventarios?.map((inventario) => (
                    <Card 
                      key={inventario.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedInventario === inventario.id 
                          ? 'bg-primary/5 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedInventario(inventario.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {inventario.numero_inventario}
                          </span>
                          {getStatusBadge(inventario.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {inventario.franquias?.nome}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(inventario.created_at), 'dd/MM/yyyy')}</span>
                          <span>{inventario.posicoes_conferidas}/{inventario.total_posicoes}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Inventário */}
        <div className="lg:col-span-2">
          {selectedInventario && inventarioAtual ? (
            <Tabs defaultValue="posicoes" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="posicoes">Posições</TabsTrigger>
                  <TabsTrigger value="itens">Itens</TabsTrigger>
                  <TabsTrigger value="relatorio">Relatório</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Progress value={calcularProgresso()} className="w-32" />
                  <span className="text-sm font-medium">{calcularProgresso()}%</span>
                </div>
              </div>

              <TabsContent value="posicoes">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Posições para Conferir</CardTitle>
                    <CardDescription>
                      {inventarioAtual.posicoes_conferidas} de {inventarioAtual.total_posicoes} posições conferidas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {posicoes?.map((posicao) => (
                        <div 
                          key={posicao.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {posicao.storage_positions?.codigo}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {posicao.storage_positions?.descricao || posicao.storage_positions?.tipo_posicao}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getStatusBadge(posicao.status)}
                            {posicao.status === 'pendente' && (
                              <Button
                                size="sm"
                                onClick={() => handleIniciarPosicao(posicao.posicao_id)}
                                disabled={iniciarPosicao.isPending}
                              >
                                <Scan className="h-4 w-4 mr-1" />
                                Iniciar
                              </Button>
                            )}
                            {posicao.status === 'em_andamento' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConcluirPosicao(posicao.posicao_id)}
                                disabled={concluirPosicao.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="itens">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Itens Inventariados</CardTitle>
                    <CardDescription>
                      Produtos encontrados durante a conferência
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código de Barras</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead className="text-right">Qtd. Encontrada</TableHead>
                          <TableHead className="text-right">Qtd. Sistema</TableHead>
                          <TableHead className="text-right">Diferença</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">
                              {item.codigo_barras || "-"}
                            </TableCell>
                            <TableCell>
                              {item.produtos?.nome || "Produto não identificado"}
                            </TableCell>
                            <TableCell>{item.lote || "-"}</TableCell>
                            <TableCell className="text-right">
                              {item.quantidade_encontrada} {item.produtos?.unidade_medida || "un"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantidade_sistema} {item.produtos?.unidade_medida || "un"}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={
                                item.diferenca > 0 ? 'text-green-600' : 
                                item.diferenca < 0 ? 'text-red-600' : 
                                'text-muted-foreground'
                              }>
                                {item.diferenca > 0 ? '+' : ''}{item.diferenca}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="relatorio">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Relatório de Divergências
                    </CardTitle>
                    <CardDescription>
                      Análise das diferenças encontradas no inventário
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Relatório será gerado após a conclusão do inventário
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="shadow-card">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um inventário para ver os detalhes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scanner Dialog */}
      {scannerOpen && selectedPosicao && (
        <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scanner de Código de Barras</DialogTitle>
              <DialogDescription>
                Escaneie os produtos encontrados nesta posição
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={scannerData.quantidade}
                  onChange={(e) => setScannerData({...scannerData, quantidade: Number(e.target.value)})}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="lote">Lote (opcional)</Label>
                <Input
                  id="lote"
                  value={scannerData.lote}
                  onChange={(e) => setScannerData({...scannerData, lote: e.target.value})}
                  placeholder="Digite o lote do produto"
                />
              </div>

              <div>
                <Label htmlFor="obs">Observações (opcional)</Label>
                <Textarea
                  id="obs"
                  value={scannerData.observacoes}
                  onChange={(e) => setScannerData({...scannerData, observacoes: e.target.value})}
                  placeholder="Adicione observações..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="codigo-barras">Código de Barras</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo-barras"
                    value={scannerData.codigo_barras}
                    onChange={(e) => setScannerData({...scannerData, codigo_barras: e.target.value})}
                    placeholder="Escaneie ou digite o código"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && scannerData.codigo_barras.trim()) {
                        handleScanSuccess(scannerData.codigo_barras.trim())
                      }
                    }}
                  />
                  <Button 
                    onClick={() => handleScanSuccess(scannerData.codigo_barras.trim())}
                    disabled={!scannerData.codigo_barras.trim()}
                  >
                    <Scan className="h-4 w-4 mr-1" />
                    Registrar
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setScannerOpen(false)}>
                Fechar Scanner
              </Button>
              {selectedPosicao && (
                <Button 
                  onClick={() => handleConcluirPosicao(selectedPosicao)}
                  disabled={concluirPosicao.isPending}
                >
                  Concluir Posição
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}