import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, Truck, Eye, AlertTriangle, Plus, Trash2 } from "lucide-react"
import { useEntradasPendentes, useAtualizarStatusEntrada } from "@/hooks/useEntradasPendentes"
import { format } from "date-fns"

interface Divergencia {
  produto: string
  quantidade_esperada: number
  quantidade_recebida: number
  motivo: string
  acao_tomada: string
}

export default function AprovacaoEntradas() {
  const { data: entradas, isLoading } = useEntradasPendentes()
  const atualizarStatus = useAtualizarStatusEntrada()
  
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'status' | 'conferencia'>('status')
  const [observacoes, setObservacoes] = useState('')
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])

  useEffect(() => {
    document.title = "Aprovação de Entradas - Sistema de Gestão"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie e aprove entradas de produtos no sistema de gestão de estoque')
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const, icon: Clock },
      'em_transferencia': { label: 'Em Transferência', variant: 'default' as const, icon: Truck },
      'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const, icon: Eye },
      'conferencia_completa': { label: 'Conferência Completa', variant: 'default' as const, icon: CheckCircle },
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
      'aguardando_conferencia': 'conferencia_completa',
      'conferencia_completa': 'confirmado'
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      'aguardando_transporte': 'Marcar como Em Transferência',
      'em_transferencia': 'Marcar como Aguardando Conferência',
      'aguardando_conferencia': 'Realizar Conferência',
      'conferencia_completa': 'Confirmar Entrada'
    }
    return statusLabels[currentStatus as keyof typeof statusLabels] || null
  }

  const handleAction = (entrada: any, type: 'status' | 'conferencia') => {
    setSelectedEntrada(entrada)
    setActionType(type)
    setObservacoes('')
    setDivergencias([])
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedEntrada) return

    const nextStatus = getNextStatus(selectedEntrada.status_aprovacao)
    if (!nextStatus) return

    await atualizarStatus.mutateAsync({
      entradaId: selectedEntrada.id,
      novoStatus: nextStatus,
      observacoes: observacoes || undefined,
      divergencias: divergencias.length > 0 ? divergencias : undefined
    })

    setDialogOpen(false)
  }

  const addDivergencia = () => {
    setDivergencias([...divergencias, {
      produto: '',
      quantidade_esperada: 0,
      quantidade_recebida: 0,
      motivo: '',
      acao_tomada: ''
    }])
  }

  const removeDivergencia = (index: number) => {
    setDivergencias(divergencias.filter((_, i) => i !== index))
  }

  const updateDivergencia = (index: number, field: keyof Divergencia, value: any) => {
    const updated = [...divergencias]
    updated[index] = { ...updated[index], [field]: value }
    setDivergencias(updated)
  }

  // Agrupar entradas por status
  const entradasPorStatus = (entradas as any[])?.reduce((acc, entrada) => {
    const status = entrada.status_aprovacao
    if (!acc[status]) acc[status] = []
    acc[status].push(entrada)
    return acc
  }, {} as Record<string, any[]>) || {}

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Aprovação de Entradas</h1>
        <p className="text-muted-foreground">
          Gerencie o fluxo de aprovação das entradas de produtos dos produtores
        </p>
      </div>

      <Tabs defaultValue="aguardando_transporte" className="space-y-4">
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
          <TabsTrigger value="conferencia_completa" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Conferência Completa ({entradasPorStatus.conferencia_completa?.length || 0})
          </TabsTrigger>
        </TabsList>

        {Object.entries(entradasPorStatus).map(([status, statusEntradas]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {(statusEntradas as any[]).length === 0 ? (
              <EmptyState 
                title="Nenhuma entrada encontrada"
                description={`Não há entradas com status "${status.replace('_', ' ')}" no momento.`}
              />
            ) : (
              <div className="grid gap-4">
                {(statusEntradas as any[]).map((entrada) => (
                  <Card key={entrada.id}>
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
                            <Button
                              onClick={() => handleAction(entrada, 'conferencia')}
                              size="sm"
                              disabled={atualizarStatus.isPending}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Realizar Conferência
                            </Button>
                          )}
                          {getNextStatusLabel(entrada.status_aprovacao) && (
                            <Button
                              onClick={() => handleAction(entrada, 'status')}
                              size="sm"
                              disabled={atualizarStatus.isPending}
                            >
                              {getNextStatusLabel(entrada.status_aprovacao)}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Data de Entrada:</strong> {format(new Date(entrada.data_entrada), 'dd/MM/yyyy')}
                        </div>
                        <div>
                          <strong>Valor Total:</strong> R$ {entrada.valor_total?.toFixed(2) || '0,00'}
                        </div>
                        <div>
                          <strong>Franquia:</strong> {entrada.franquias?.nome || 'N/A'}
                        </div>
                        <div>
                          <strong>Itens:</strong> {entrada.entrada_itens?.length || 0} produto(s)
                        </div>
                      </div>

                      {entrada.entrada_itens?.length > 0 && (
                        <div className="mt-4">
                          <Separator className="mb-4" />
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Valor Unit.</TableHead>
                                <TableHead>Lote</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entrada.entrada_itens.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.produtos?.nome || item.nome_produto}</TableCell>
                                  <TableCell>{item.quantidade} {item.produtos?.unidade_medida}</TableCell>
                                  <TableCell>R$ {item.valor_unitario?.toFixed(2) || '0,00'}</TableCell>
                                  <TableCell>{item.lote || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {entrada.divergencias && entrada.divergencias.length > 0 && (
                        <div className="mt-4">
                          <Separator className="mb-4" />
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <strong className="text-destructive">Divergências Registradas</strong>
                          </div>
                          {entrada.divergencias.map((div: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg bg-destructive/5">
                              <div className="text-sm space-y-1">
                                <div><strong>Produto:</strong> {div.produto}</div>
                                <div><strong>Esperado:</strong> {div.quantidade_esperada} | <strong>Recebido:</strong> {div.quantidade_recebida}</div>
                                <div><strong>Motivo:</strong> {div.motivo}</div>
                                <div><strong>Ação:</strong> {div.acao_tomada}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'conferencia' ? 'Realizar Conferência' : 'Atualizar Status'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'conferencia' 
                ? 'Confira os itens recebidos e registre eventuais divergências'
                : `Confirmar mudança de status para "${getNextStatusLabel(selectedEntrada?.status_aprovacao || '')}"`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'conferencia' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Divergências</Label>
                  <Button onClick={addDivergencia} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Divergência
                  </Button>
                </div>

                {divergencias.map((div, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Divergência {index + 1}</Label>
                        <Button
                          onClick={() => removeDivergencia(index)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Produto</Label>
                          <Input
                            value={div.produto}
                            onChange={(e) => updateDivergencia(index, 'produto', e.target.value)}
                            placeholder="Nome do produto"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Qtd. Esperada</Label>
                            <Input
                              type="number"
                              value={div.quantidade_esperada}
                              onChange={(e) => updateDivergencia(index, 'quantidade_esperada', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Qtd. Recebida</Label>
                            <Input
                              type="number"
                              value={div.quantidade_recebida}
                              onChange={(e) => updateDivergencia(index, 'quantidade_recebida', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Motivo da Divergência</Label>
                        <Textarea
                          value={div.motivo}
                          onChange={(e) => updateDivergencia(index, 'motivo', e.target.value)}
                          placeholder="Descreva o motivo da divergência"
                        />
                      </div>
                      
                      <div>
                        <Label>Ação Tomada</Label>
                        <Textarea
                          value={div.acao_tomada}
                          onChange={(e) => updateDivergencia(index, 'acao_tomada', e.target.value)}
                          placeholder="Descreva a ação tomada"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta etapa (opcional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={atualizarStatus.isPending}>
              {atualizarStatus.isPending ? 'Atualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}