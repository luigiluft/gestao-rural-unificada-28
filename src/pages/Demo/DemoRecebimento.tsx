import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckCircle, Clock, Truck, Eye, AlertTriangle, Plus, Trash2, Scan, Calculator, X, Package } from "lucide-react"
import { format } from "date-fns"
import { useTutorial } from "@/contexts/TutorialContext"

const StatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    const statusConfig = {
      'aguardando_transporte': 'secondary' as const,
      'em_transferencia': 'default' as const,
      'aguardando_conferencia': 'outline' as const,
      'planejamento': 'default' as const,
    }
    return statusConfig[status as keyof typeof statusConfig] || 'outline'
  }

  const getLabel = (status: string) => {
    const statusLabels = {
      'aguardando_transporte': 'Aguardando Transporte',
      'em_transferencia': 'Em Transferência',
      'aguardando_conferencia': 'Aguardando Conferência',
      'planejamento': 'Planejamento',
    }
    return statusLabels[status as keyof typeof statusLabels] || status
  }

  return <Badge variant={getVariant(status)}>{getLabel(status)}</Badge>
}

interface Divergencia {
  produto: string
  quantidade_esperada: number
  quantidade_recebida: number
  motivo: string
  acao_tomada: string
}

export default function DemoRecebimento() {
  const { handleTargetClick, nextStep, currentStepData } = useTutorial()
  const [activeTab, setActiveTab] = useState('aguardando_transporte')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'status' | 'conferencia' | 'conferencia_barras' | 'planejamento' | 'planejar_pallets'>('status')
  const [observacoes, setObservacoes] = useState('')
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null)

  useEffect(() => {
    document.title = "Recebimento - AgroHub"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie o recebimento de produtos no AgroHub - Demo')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const, icon: Clock },
      'em_transferencia': { label: 'Em Transferência', variant: 'default' as const, icon: Truck },
      'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const, icon: Eye },
      'planejamento': { label: 'Planejamento', variant: 'default' as const, icon: Package },
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

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'aguardando_transporte': 'em_transferencia',
      'em_transferencia': 'aguardando_conferencia',
      'aguardando_conferencia': 'planejamento',
      'planejamento': 'confirmado'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      'aguardando_transporte': 'Marcar como Em Transferência',
      'em_transferencia': 'Marcar como Aguardando Conferência',
      'aguardando_conferencia': 'Realizar Conferência',
      'planejamento': 'Finalizar Planejamento e Enviar para Alocação'
    }
    return statusLabels[currentStatus as keyof typeof statusLabels] || null
  }

  // Mock data with entries in different statuses
  const mockEntradas = [
    {
      id: 'entrada-demo-1',
      numero_nfe: '000123456',
      status_aprovacao: 'aguardando_transporte',
      data_entrada: '2024-09-17',
      valor_total: 15250.00,
      profiles: { nome: 'Produtor Demo' },
      fornecedores: { nome: 'Fornecedor ABC Ltda' },
      entrada_itens: [
        { 
          id: 'item-1',
          nome_produto: 'Soja em Grãos Premium', 
          quantidade: 500, 
          unidade_comercial: 'SC',
          valor_unitario: 25.50,
          valor_total: 12750.00,
          produtos: { nome: 'Soja em Grãos Premium', codigo: 'SOJ001' }
        },
        { 
          id: 'item-2',
          nome_produto: 'Fertilizante NPK', 
          quantidade: 100, 
          unidade_comercial: 'KG',
          valor_unitario: 25.00,
          valor_total: 2500.00,
          produtos: { nome: 'Fertilizante NPK', codigo: 'FERT001' }
        }
      ]
    },
    {
      id: 'entrada-demo-2',
      numero_nfe: '000123457',
      status_aprovacao: 'em_transferencia',
      data_entrada: '2024-09-16',
      valor_total: 8500.00,
      profiles: { nome: 'Produtor Demo 2' },
      fornecedores: { nome: 'Fornecedor XYZ Ltda' },
      entrada_itens: [
        { 
          id: 'item-3',
          nome_produto: 'Milho Amarelo', 
          quantidade: 800, 
          unidade_comercial: 'SC',
          valor_unitario: 10.50,
          valor_total: 8400.00,
          produtos: { nome: 'Milho Amarelo', codigo: 'MIL001' }
        }
      ]
    },
    {
      id: 'entrada-demo-3',
      numero_nfe: '000123458',
      status_aprovacao: 'aguardando_conferencia',
      data_entrada: '2024-09-15',
      valor_total: 3750.00,
      profiles: { nome: 'Produtor Demo 3' },
      fornecedores: { nome: 'Fornecedor 123 Ltda' },
      entrada_itens: [
        { 
          id: 'item-4',
          nome_produto: 'Feijão Carioca', 
          quantidade: 250, 
          unidade_comercial: 'SC',
          valor_unitario: 15.00,
          valor_total: 3750.00,
          produtos: { nome: 'Feijão Carioca', codigo: 'FEI001' }
        }
      ]
    },
    {
      id: 'entrada-demo-4',
      numero_nfe: '000123459',
      status_aprovacao: 'planejamento',
      data_entrada: '2024-09-14',
      valor_total: 12000.00,
      profiles: { nome: 'Produtor Demo 4' },
      fornecedores: { nome: 'Fornecedor Premium Ltda' },
      entrada_itens: [
        { 
          id: 'item-5',
          nome_produto: 'Arroz Tipo 1', 
          quantidade: 600, 
          unidade_comercial: 'SC',
          valor_unitario: 20.00,
          valor_total: 12000.00,
          produtos: { nome: 'Arroz Tipo 1', codigo: 'ARR001' }
        }
      ]
    }
  ]

  const handleAction = (entrada: any, type: 'status' | 'conferencia' | 'conferencia_barras' | 'planejamento' | 'planejar_pallets') => {
    setSelectedEntrada(entrada)
    setActionType(type)
    setObservacoes('')
    setDivergencias([])
    setDialogOpen(true)
  }

  const handleConfirm = () => {
    if (!selectedEntrada) return

    // Handle different action types
    if (actionType === 'planejar_pallets') {
      // For pallet planning, close modal and advance tutorial step
      setDialogOpen(false)
      setTimeout(() => {
        if (nextStep) nextStep()
      }, 500)
      return
    }

    const nextStatus = getNextStatus(selectedEntrada.status_aprovacao)
    if (!nextStatus) return

    // Update the entrada status
    const updatedEntradas = mockEntradas.map(entrada => 
      entrada.id === selectedEntrada.id 
        ? { ...entrada, status_aprovacao: nextStatus }
        : entrada
    )

    // Move to appropriate tab
    setActiveTab(nextStatus)
    setDialogOpen(false)
    
    // Trigger tutorial step advancement
    setTimeout(() => {
      if (nextStep) nextStep()
    }, 500)
  }

  const addDivergencia = (item?: any) => {
    const novaDivergencia = {
      produto: item ? (item.produtos?.nome || item.nome_produto || '') : '',
      quantidade_esperada: item ? item.quantidade || 0 : 0,
      quantidade_recebida: item ? item.quantidade || 0 : 0,
      motivo: '',
      acao_tomada: ''
    }
    setDivergencias([...divergencias, novaDivergencia])
  }

  const removeDivergencia = (index: number) => {
    setDivergencias(divergencias.filter((_, i) => i !== index))
  }

  const updateDivergencia = (index: number, field: keyof Divergencia, value: any) => {
    const updated = [...divergencias]
    updated[index] = { ...updated[index], [field]: value }
    setDivergencias(updated)
  }

  // Helper functions for empty states
  const getEmptyStateDescription = (status: string) => {
    const descriptions = {
      'aguardando_transporte': 'Não há produtos aguardando transporte no momento. Novos pedidos aparecerão aqui quando criados.',
      'em_transferencia': 'Nenhum produto está em transferência. Os pedidos aparecerão aqui quando estiverem a caminho do depósito.',
      'aguardando_conferencia': 'Não há produtos aguardando conferência. Produtos em transferência aparecerão aqui quando chegarem.',
      'planejamento': 'Não há produtos em planejamento. Produtos conferidos aparecerão aqui para planejamento de pallets.'
    }
    return descriptions[status as keyof typeof descriptions] || 'Não há pedidos neste status no momento.'
  }

  // Group entries by status
  const entradasPorStatus = mockEntradas.reduce((acc, entrada) => {
    const status = entrada.status_aprovacao
    if (!acc[status]) acc[status] = []
    acc[status].push(entrada)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recebimento</h1>
        <p className="text-muted-foreground">
          Gerencie o recebimento de produtos dos produtores - Demo Tutorial
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aguardando_transporte" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Aguardando Transporte ({entradasPorStatus.aguardando_transporte?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="em_transferencia" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Em Transferência ({entradasPorStatus.em_transferencia?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="aguardando_conferencia" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aguardando Conferência ({entradasPorStatus.aguardando_conferencia?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="planejamento" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Planejamento ({entradasPorStatus.planejamento?.length || 0})
          </TabsTrigger>
        </TabsList>

        {['aguardando_transporte', 'em_transferencia', 'aguardando_conferencia', 'planejamento'].map((status) => {
          const statusEntradas = entradasPorStatus[status] || []
          return (
            <TabsContent key={status} value={status} className="space-y-4">
              {statusEntradas.length === 0 ? (
                <EmptyState 
                  title="Nenhum pedido de recebimento"
                  description={getEmptyStateDescription(status)}
                />
              ) : (
                <div className="grid gap-4">
                  {statusEntradas.map((entrada) => (
                    <Card key={entrada.id} data-tutorial={status === activeTab ? `entrada-card-${entrada.numero_nfe}` : undefined}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              NFe {entrada.numero_nfe || 'S/N'}
                              {getStatusBadge(entrada.status_aprovacao)}
                            </CardTitle>
                            <CardDescription>
                              Produtor: {entrada.profiles?.nome} • Fornecedor: {entrada.fornecedores?.nome}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {entrada.status_aprovacao === 'aguardando_conferencia' && (
                              <>
                                <Button
                                  onClick={() => handleAction(entrada, 'conferencia_barras')}
                                  size="sm"
                                  variant="outline"
                                  data-tutorial="conferencia-barras-btn"
                                >
                                  <Scan className="h-4 w-4 mr-2" />
                                  Conferência por Código de Barras
                                </Button>
                                <Button
                                  onClick={() => handleAction(entrada, 'conferencia')}
                                  size="sm"
                                  data-tutorial="conferencia-manual-btn"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Conferência Manual
                                </Button>
                              </>
                            )}
                            {entrada.status_aprovacao === 'planejamento' && (
                              <Button
                                onClick={() => handleAction(entrada, 'planejar_pallets')}
                                size="sm"
                                data-tutorial="planejar-pallets-btn"
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Planejar Pallets
                              </Button>
                            )}
                            {['aguardando_transporte', 'em_transferencia'].includes(entrada.status_aprovacao) && (
                              <Button
                                onClick={() => handleAction(entrada, 'status')}
                                size="sm"
                                data-tutorial={`avancar-status-${entrada.status_aprovacao}`}
                              >
                                {getNextStatusLabel(entrada.status_aprovacao)}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Data de Entrada:</span>
                              <p className="font-medium">{format(new Date(entrada.data_entrada), "dd/MM/yyyy")}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor Total:</span>
                              <p className="font-medium">R$ {entrada.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Itens:</span>
                              <p className="font-medium">{entrada.entrada_itens?.length || 0} produto(s)</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-medium mb-2">Produtos:</h4>
                            <div className="space-y-2">
                              {entrada.entrada_itens?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                                  <span>{item.nome_produto} - {item.quantidade} {item.unidade_comercial}</span>
                                  <span className="text-muted-foreground">
                                    R$ {item.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Dialog for Actions */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-tutorial="modal-planejamento">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'conferencia' && 'Conferência Manual'}
              {actionType === 'conferencia_barras' && 'Conferência por Código de Barras'}
              {actionType === 'planejamento' && 'Planejamento de Pallets'}
              {actionType === 'planejar_pallets' && 'Planejamento de Pallets'}
              {actionType === 'status' && `Atualizar Status - ${getNextStatusLabel(selectedEntrada?.status_aprovacao || '')}`}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'conferencia' && 'Confira manualmente os produtos recebidos e registre divergências se necessário.'}
              {actionType === 'conferencia_barras' && 'Use o leitor de código de barras para conferir os produtos.'}
              {actionType === 'planejamento' && 'Organize os produtos em pallets para armazenamento.'}
              {actionType === 'planejar_pallets' && 'Configure a distribuição dos produtos em pallets para otimizar o armazenamento.'}
              {actionType === 'status' && 'Confirme a mudança de status da entrada.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Manual Conference */}
            {actionType === 'conferencia' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Produtos Esperados:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEntrada?.entrada_itens?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.nome_produto}</TableCell>
                          <TableCell>{item.quantidade} {item.unidade_comercial}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addDivergencia(item)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Registrar Divergência
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {divergencias.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Divergências:</h4>
                    <div className="space-y-2">
                      {divergencias.map((div, index) => (
                        <div key={index} className="border rounded p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{div.produto}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeDivergencia(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`esperada-${index}`}>Quantidade Esperada</Label>
                              <Input
                                id={`esperada-${index}`}
                                type="number"
                                value={div.quantidade_esperada}
                                onChange={(e) => updateDivergencia(index, 'quantidade_esperada', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`recebida-${index}`}>Quantidade Recebida</Label>
                              <Input
                                id={`recebida-${index}`}
                                type="number"
                                value={div.quantidade_recebida}
                                onChange={(e) => updateDivergencia(index, 'quantidade_recebida', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`motivo-${index}`}>Motivo</Label>
                            <Textarea
                              id={`motivo-${index}`}
                              value={div.motivo}
                              onChange={(e) => updateDivergencia(index, 'motivo', e.target.value)}
                              placeholder="Descreva o motivo da divergência"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`acao-${index}`}>Ação Tomada</Label>
                            <Textarea
                              id={`acao-${index}`}
                              value={div.acao_tomada}
                              onChange={(e) => updateDivergencia(index, 'acao_tomada', e.target.value)}
                              placeholder="Descreva a ação tomada"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Barcode Conference - Simplified for demo */}
            {actionType === 'conferencia_barras' && (
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Scan className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Escaneando Produtos...</h3>
                  <p className="text-muted-foreground">Esta é uma simulação da conferência por código de barras</p>
                  <Button className="mt-4" onClick={() => {
                    // Simulate barcode scanning completion
                    setTimeout(() => {
                      setDialogOpen(false)
                      nextStep && nextStep()
                    }, 1000)
                  }}>
                    Simular Conferência Completa
                  </Button>
                </div>
              </div>
            )}

            {/* Pallet Planning - Simplified for demo */}
            {actionType === 'planejamento' && (
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Planejando Pallets...</h3>
                  <p className="text-muted-foreground">Esta é uma simulação do planejamento de pallets</p>
                  <Button className="mt-4" onClick={() => {
                    // Simulate pallet planning completion
                    setTimeout(() => {
                      setDialogOpen(false)
                      nextStep && nextStep()
                    }, 1000)
                  }}>
                    Simular Planejamento Completo
                  </Button>
                </div>
              </div>
            )}

            {/* New Pallet Planning Modal */}
            {actionType === 'planejar_pallets' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div data-tutorial="produtos-entrada-secao">
                    <h4 className="font-medium mb-3">Produtos da Entrada</h4>
                    <div className="space-y-2">
                      {selectedEntrada?.entrada_itens?.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-3 bg-muted/20">
                          <div className="font-medium text-sm">{item.nome_produto}</div>
                          <div className="text-xs text-muted-foreground">
                            Quantidade: {item.quantidade} {item.unidade_comercial}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Código: {item.produtos?.codigo}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div data-tutorial="configuracao-pallets-secao">
                    <h4 className="font-medium mb-3">Configuração de Pallets</h4>
                    <div className="space-y-4">
                      <div 
                        className="border rounded-lg p-4 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors" 
                        data-tutorial="pallet-individual"
                        onClick={() => {
                          // Simulate pallet configuration change only when on the correct tutorial step
                          if (currentStepData?.id !== 'pallet-individual') return;
                          const palletCard = document.querySelector('[data-tutorial="pallet-individual"]');
                          if (palletCard) {
                            palletCard.classList.add('bg-blue-100', 'border-blue-300');
                            palletCard.querySelector('.badge')?.classList.add('bg-blue-100');
                            setTimeout(() => {
                              nextStep();
                            }, 500);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">Pallet #001</span>
                          <Badge variant="outline" className="text-xs badge">Configurado</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>• Arroz Tipo 1: 300 SC</div>
                          <div>• Capacidade: 80% utilizada</div>
                          <div>• Posição sugerida: A1-001</div>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 opacity-75">
                          💡 Clique para simular ajuste
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">Pallet #002</span>
                          <Badge variant="outline" className="text-xs">Configurado</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>• Arroz Tipo 1: 300 SC</div>
                          <div>• Capacidade: 80% utilizada</div>
                          <div>• Posição sugerida: A1-002</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4" data-tutorial="resumo-planejamento">
                  <h4 className="font-medium mb-3">Resumo do Planejamento</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Pallets:</span>
                      <span className="font-medium">2 pallets</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produtos Alocados:</span>
                      <span className="font-medium">600/600 SC (100%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="default" className="text-xs">Pronto para Alocação</Badge>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Eficiência de Espaço:</span>
                      <span className="font-medium">Ótima (80%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Update */}
            {actionType === 'status' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione observações sobre esta atualização..."
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              data-tutorial={actionType === 'planejar_pallets' ? 'finalizar-planejamento-btn' : 'confirmar-acao'}
            >
              {actionType === 'status' && 'Confirmar'}
              {actionType === 'conferencia' && 'Finalizar Conferência'}
              {actionType === 'conferencia_barras' && 'Finalizar Conferência'}
              {actionType === 'planejamento' && 'Finalizar Planejamento'}
              {actionType === 'planejar_pallets' && 'Finalizar Planejamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}