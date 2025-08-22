import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Square,
  Settings,
  ArrowLeft,
  ClipboardList,
  Calculator,
  Eye
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
import { useToast } from "@/hooks/use-toast"

type InventoryStep = 'select-positions' | 'select-method' | 'execution' | 'complete'

interface InventoryConfig {
  franquiaId: string
  franquiaNome: string
  posicoesSelecionadas: any[]
  observacoes: string
  method: 'manual' | 'scanner' | null
}

export default function Inventario() {
  const [currentStep, setCurrentStep] = useState<InventoryStep>('select-positions')
  const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig>({
    franquiaId: '',
    franquiaNome: '',
    posicoesSelecionadas: [],
    observacoes: '',
    method: null
  })
  const [selectedInventario, setSelectedInventario] = useState<string | null>(null)
  const [currentInventoryId, setCurrentInventoryId] = useState<string | null>(null)
  const [currentPosition, setCurrentPosition] = useState<any>(null)
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0)
  const [scannerData, setScannerData] = useState({
    codigo_barras: "",
    quantidade: 1,
    lote: "",
    observacoes: ""
  })
  const [manualData, setManualData] = useState({
    produto: "",
    quantidade: 1,
    lote: "",
    observacoes: ""
  })
  const [divergencias, setDivergencias] = useState<any[]>([])
  const [showDivergencias, setShowDivergencias] = useState(false)

  const { data: inventarios, isLoading: loadingInventarios } = useInventarios()
  const { data: inventarioAtual } = useInventario(currentInventoryId || undefined)
  const { data: posicoes } = useInventarioPosicoes(currentInventoryId || undefined)
  const { data: itens } = useInventarioItens(currentInventoryId || undefined)
  const { data: todasPosicoes } = useStoragePositions(inventoryConfig.franquiaId)
  const { data: depositos } = useDepositosDisponiveis()
  
  const criarInventario = useCriarInventario()
  const atualizarInventario = useAtualizarInventario()
  const iniciarPosicao = useIniciarPosicao()
  const adicionarItem = useAdicionarItem()
  const concluirPosicao = useConcluirPosicao()
  
  const { toast } = useToast()

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

  const handleStartNewInventory = () => {
    setCurrentStep('select-positions')
    setInventoryConfig({
      franquiaId: '',
      franquiaNome: '',
      posicoesSelecionadas: [],
      observacoes: '',
      method: null
    })
    setSelectedInventario(null)
    setCurrentInventoryId(null)
  }

  const handleSelectPositions = () => {
    if (inventoryConfig.franquiaId && inventoryConfig.posicoesSelecionadas.length > 0) {
      setCurrentStep('select-method')
    } else {
      toast({
        title: "Seleção incompleta",
        description: "Selecione uma franquia e pelo menos uma posição",
        variant: "destructive"
      })
    }
  }

  const handleSelectMethod = async (method: 'manual' | 'scanner') => {
    setInventoryConfig(prev => ({ ...prev, method }))
    
    // Criar o inventário
    try {
      const result = await criarInventario.mutateAsync({
        deposito_id: inventoryConfig.franquiaId,
        observacoes: inventoryConfig.observacoes,
        posicoes_ids: inventoryConfig.posicoesSelecionadas.map(p => p.id)
      })
      
      setCurrentInventoryId(result.id)
      setCurrentStep('execution')
      setCurrentPositionIndex(0)
      
      toast({
        title: "Inventário iniciado",
        description: `Método ${method === 'manual' ? 'manual' : 'scanner'} selecionado`,
      })
    } catch (error) {
      toast({
        title: "Erro ao criar inventário",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const handleAdicionarItem = async () => {
    if (!currentInventoryId || !currentPosition) return

    try {
      const codigo_barras = inventoryConfig.method === 'manual' ? manualData.produto : scannerData.codigo_barras
      const quantidade = inventoryConfig.method === 'manual' ? manualData.quantidade : scannerData.quantidade
      const lote = inventoryConfig.method === 'manual' ? manualData.lote : scannerData.lote
      const observacoes = inventoryConfig.method === 'manual' ? manualData.observacoes : scannerData.observacoes

      await adicionarItem.mutateAsync({
        inventario_id: currentInventoryId,
        posicao_id: currentPosition.posicao_id,
        codigo_barras,
        quantidade_encontrada: quantidade,
        lote,
        observacoes
      })

      // Reset form
      if (inventoryConfig.method === 'manual') {
        setManualData({ produto: "", quantidade: 1, lote: "", observacoes: "" })
      } else {
        setScannerData({ codigo_barras: "", quantidade: 1, lote: "", observacoes: "" })
      }

      toast({
        title: "Item adicionado",
        description: "Item registrado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar item",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const handleConcluirPosicao = async () => {
    if (!currentInventoryId || !currentPosition) return

    try {
      await concluirPosicao.mutateAsync({
        inventarioId: currentInventoryId,
        posicaoId: currentPosition.posicao_id
      })

      // Ir para próxima posição ou finalizar
      if (currentPositionIndex < inventoryConfig.posicoesSelecionadas.length - 1) {
        setCurrentPositionIndex(currentPositionIndex + 1)
      } else {
        // Finalizar inventário e calcular divergências
        await calcularDivergencias()
        setCurrentStep('complete')
      }

      toast({
        title: "Posição concluída",
        description: "Passando para próxima posição",
      })
    } catch (error) {
      toast({
        title: "Erro ao concluir posição",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const calcularDivergencias = async () => {
    // Simular cálculo de divergências
    // Na implementação real, isso seria uma consulta ao banco comparando:
    // quantidade_sistema vs quantidade_encontrada
    const mockDivergencias = [
      {
        produto: "Produto A",
        lote: "LOTE001",
        quantidade_sistema: 100,
        quantidade_encontrada: 98,
        diferenca: -2,
        tipo: "FALTA",
        valor_impacto: 20.50
      },
      {
        produto: "Produto B",
        lote: "LOTE002",
        quantidade_sistema: 50,
        quantidade_encontrada: 52,
        diferenca: 2,
        tipo: "SOBRA",
        valor_impacto: 15.30
      }
    ]
    
    setDivergencias(mockDivergencias)
  }

  const handleViewInventory = (inventarioId: string) => {
    setSelectedInventario(inventarioId)
    setCurrentInventoryId(inventarioId)
    setCurrentStep('complete')
  }

  // Update current position based on index
  useEffect(() => {
    if (inventoryConfig.posicoesSelecionadas.length > 0 && currentPositionIndex < inventoryConfig.posicoesSelecionadas.length) {
      setCurrentPosition(inventoryConfig.posicoesSelecionadas[currentPositionIndex])
    }
  }, [currentPositionIndex, inventoryConfig.posicoesSelecionadas])

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

  // Step 1: Seleção de Posições
  if (currentStep === 'select-positions') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novo Inventário</h1>
            <p className="text-muted-foreground">
              Selecione a franquia e as posições que deseja inventariar
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração do Inventário
            </CardTitle>
            <CardDescription>
              Configure os parâmetros do inventário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="franquia">Franquia</Label>
              <Select 
                value={inventoryConfig.franquiaId} 
                onValueChange={(value) => {
                  const franquia = depositos?.find(d => d.deposito_id === value)
                  setInventoryConfig(prev => ({ 
                    ...prev, 
                    franquiaId: value,
                    franquiaNome: franquia?.deposito_nome || '',
                    posicoesSelecionadas: []
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma franquia" />
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

            {inventoryConfig.franquiaId && (
              <div>
                <Label>Posições ({inventoryConfig.posicoesSelecionadas.length} selecionadas)</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (inventoryConfig.posicoesSelecionadas.length === todasPosicoes?.length) {
                          setInventoryConfig(prev => ({ ...prev, posicoesSelecionadas: [] }))
                        } else {
                          setInventoryConfig(prev => ({ ...prev, posicoesSelecionadas: todasPosicoes || [] }))
                        }
                      }}
                    >
                      {inventoryConfig.posicoesSelecionadas.length === todasPosicoes?.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {todasPosicoes?.map((posicao) => (
                      <div key={posicao.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={posicao.id}
                          checked={inventoryConfig.posicoesSelecionadas.some(p => p.id === posicao.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setInventoryConfig(prev => ({
                                ...prev,
                                posicoesSelecionadas: [...prev.posicoesSelecionadas, posicao]
                              }))
                            } else {
                              setInventoryConfig(prev => ({
                                ...prev,
                                posicoesSelecionadas: prev.posicoesSelecionadas.filter(p => p.id !== posicao.id)
                              }))
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
              </div>
            )}

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={inventoryConfig.observacoes}
                onChange={(e) => setInventoryConfig(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Adicione observações sobre este inventário..."
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSelectPositions}>
                Próximo: Selecionar Método
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Seleção do Método
  if (currentStep === 'select-method') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Método de Inventário</h1>
            <p className="text-muted-foreground">
              Escolha como deseja realizar o inventário
            </p>
          </div>
          <Button variant="outline" onClick={() => setCurrentStep('select-positions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectMethod('manual')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-blue-600" />
                Inventário Manual
              </CardTitle>
              <CardDescription>
                Digite manualmente os produtos e quantidades encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Mais controle sobre os dados
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Funciona sem equipamentos especiais
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Ideal para produtos sem código de barras
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectMethod('scanner')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-6 w-6 text-green-600" />
                Inventário com Scanner
              </CardTitle>
              <CardDescription>
                Use códigos de barras para agilizar o processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Processo mais rápido
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Menos erros de digitação
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Ideal para produtos com código de barras
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Step 3: Execução do Inventário
  if (currentStep === 'execution' && currentPosition) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Inventário {inventoryConfig.method === 'manual' ? 'Manual' : 'com Scanner'}
            </h1>
            <p className="text-muted-foreground">
              Posição {currentPositionIndex + 1} de {inventoryConfig.posicoesSelecionadas.length}: {currentPosition?.codigo}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Progress 
              value={(currentPositionIndex / inventoryConfig.posicoesSelecionadas.length) * 100} 
              className="w-32"
            />
            <span className="text-sm font-medium">
              {Math.round((currentPositionIndex / inventoryConfig.posicoesSelecionadas.length) * 100)}%
            </span>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Posição: {currentPosition?.codigo}
            </CardTitle>
            <CardDescription>
              {currentPosition?.descricao || currentPosition?.tipo_posicao}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {inventoryConfig.method === 'manual' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="produto">Produto</Label>
                  <Input
                    id="produto"
                    value={manualData.produto}
                    onChange={(e) => setManualData(prev => ({ ...prev, produto: e.target.value }))}
                    placeholder="Nome ou código do produto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={manualData.quantidade}
                      onChange={(e) => setManualData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lote">Lote</Label>
                    <Input
                      id="lote"
                      value={manualData.lote}
                      onChange={(e) => setManualData(prev => ({ ...prev, lote: e.target.value }))}
                      placeholder="Número do lote"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={manualData.observacoes}
                    onChange={(e) => setManualData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre o item"
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input
                    id="codigo_barras"
                    value={scannerData.codigo_barras}
                    onChange={(e) => setScannerData(prev => ({ ...prev, codigo_barras: e.target.value }))}
                    placeholder="Escaneie ou digite o código"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={scannerData.quantidade}
                      onChange={(e) => setScannerData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lote">Lote</Label>
                    <Input
                      id="lote"
                      value={scannerData.lote}
                      onChange={(e) => setScannerData(prev => ({ ...prev, lote: e.target.value }))}
                      placeholder="Número do lote"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={scannerData.observacoes}
                    onChange={(e) => setScannerData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre o item"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleAdicionarItem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
              <Button onClick={handleConcluirPosicao}>
                {currentPositionIndex < inventoryConfig.posicoesSelecionadas.length - 1 ? 
                  "Próxima Posição" : "Finalizar Inventário"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de itens já adicionados na posição atual */}
        {itens && itens.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Itens Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto/Código</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.codigo_barras}</TableCell>
                      <TableCell>{item.quantidade_encontrada}</TableCell>
                      <TableCell>{item.lote || '-'}</TableCell>
                      <TableCell>{item.observacoes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Step 4: Inventário Completo / Visualização
  if (currentStep === 'complete') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedInventario ? 'Visualizar Inventário' : 'Inventário Concluído'}
            </h1>
            <p className="text-muted-foreground">
              {selectedInventario ? 'Detalhes do inventário selecionado' : 'Relatório de divergências e resultados'}
            </p>
          </div>
          <Button variant="outline" onClick={handleStartNewInventory}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Inventário
          </Button>
        </div>

        {divergencias.length > 0 && (
          <Card className="shadow-card border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Divergências Encontradas
              </CardTitle>
              <CardDescription>
                {divergencias.length} divergências identificadas durante o inventário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Encontrado</TableHead>
                    <TableHead>Diferença</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Impacto (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divergencias.map((div, index) => (
                    <TableRow key={index}>
                      <TableCell>{div.produto}</TableCell>
                      <TableCell>{div.lote}</TableCell>
                      <TableCell>{div.quantidade_sistema}</TableCell>
                      <TableCell>{div.quantidade_encontrada}</TableCell>
                      <TableCell className={div.diferenca > 0 ? 'text-green-600' : 'text-red-600'}>
                        {div.diferenca > 0 ? '+' : ''}{div.diferenca}
                      </TableCell>
                      <TableCell>
                        <Badge variant={div.tipo === 'FALTA' ? 'destructive' : 'secondary'}>
                          {div.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {div.valor_impacto.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Resumo do inventário */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Posições Conferidas</p>
                  <p className="text-2xl font-bold text-blue-700">{inventarioAtual?.posicoes_conferidas || inventoryConfig.posicoesSelecionadas.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Itens Registrados</p>
                  <p className="text-2xl font-bold text-green-700">{itens?.length || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Divergências</p>
                  <p className="text-2xl font-bold text-amber-700">{divergencias.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Página principal - Lista de inventários existentes
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

        <Button onClick={handleStartNewInventory} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Inventário
        </Button>
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

      {/* Lista de Inventários */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inventários Realizados
          </CardTitle>
          <CardDescription>
            Histórico de inventários e conferências
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventarios?.length === 0 ? (
            <EmptyState
              title="Nenhum inventário realizado"
              description="Crie seu primeiro inventário para começar a conferir o estoque"
              action={{
                label: "Criar Primeiro Inventário",
                onClick: handleStartNewInventory
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Franquia</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventarios?.map((inventario) => (
                  <TableRow key={inventario.id}>
                    <TableCell className="font-medium">
                      {inventario.numero_inventario}
                    </TableCell>
                    <TableCell>{inventario.franquias?.nome}</TableCell>
                    <TableCell>{format(new Date(inventario.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(inventario.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(inventario.posicoes_conferidas / inventario.total_posicoes) * 100} 
                          className="w-16" 
                        />
                        <span className="text-sm">
                          {inventario.posicoes_conferidas}/{inventario.total_posicoes}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInventory(inventario.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}