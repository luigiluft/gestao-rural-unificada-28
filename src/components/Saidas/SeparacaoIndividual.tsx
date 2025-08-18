import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Scan, CheckCircle, Minus, Plus } from 'lucide-react'
import { useSeparacaoItens, ItemSeparacao } from '@/hooks/useSeparacaoItens'
import { ScannerCodigoBarras } from './ScannerCodigoBarras'

interface SeparacaoIndividualProps {
  saida: any
  open: boolean
  onClose: () => void
}

export function SeparacaoIndividual({ saida, open, onClose }: SeparacaoIndividualProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<string | null>(null)
  
  const {
    itensSeparacao,
    separarItem,
    finalizarSeparacao,
    atualizarQuantidadeSeparada,
    inicializarSeparacao
  } = useSeparacaoItens()

  useEffect(() => {
    if (saida?.saida_itens && open) {
      inicializarSeparacao(saida.saida_itens)
    }
  }, [saida, open, inicializarSeparacao])

  const handleQuantidadeChange = (itemId: string, novaQuantidade: number) => {
    atualizarQuantidadeSeparada(itemId, novaQuantidade)
    separarItem.mutate({ itemId, quantidadeSeparada: novaQuantidade })
  }

  const handleScanSuccess = (itemId: string) => {
    const item = itensSeparacao.find(i => i.id === itemId)
    if (item && item.quantidade_separada < item.quantidade_total) {
      const novaQuantidade = item.quantidade_separada + 1
      handleQuantidadeChange(itemId, novaQuantidade)
    }
    setShowScanner(false)
    setItemSelecionado(null)
  }

  const getTotalProgress = () => {
    const totalItens = itensSeparacao.reduce((acc, item) => acc + item.quantidade_total, 0)
    const totalSeparado = itensSeparacao.reduce((acc, item) => acc + item.quantidade_separada, 0)
    return totalItens > 0 ? (totalSeparado / totalItens) * 100 : 0
  }

  const podeFinalizarSeparacao = () => {
    return itensSeparacao.every(item => item.quantidade_separada >= item.quantidade_total)
  }

  const handleFinalizarSeparacao = async () => {
    if (podeFinalizarSeparacao()) {
      await finalizarSeparacao.mutateAsync({ saidaId: saida.id })
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Separação Individual - SAI{saida?.id?.slice(-6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Geral */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Progresso da Separação</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(getTotalProgress())}% concluído
                    </span>
                  </div>
                  <Progress value={getTotalProgress()} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Itens */}
            <div className="space-y-4">
              {itensSeparacao.map((item) => {
                const progress = (item.quantidade_separada / item.quantidade_total) * 100
                const isCompleto = item.quantidade_separada >= item.quantidade_total

                return (
                  <Card key={item.id} className={`transition-colors ${isCompleto ? 'border-green-200 bg-green-50/30' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{item.produto_nome}</h3>
                          {item.lote && (
                            <p className="text-sm text-muted-foreground">Lote: {item.lote}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleto && (
                            <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progresso</span>
                          <span>{item.quantidade_separada} de {item.quantidade_total} {item.unidade_medida}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <Separator />

                      <div className="flex items-center gap-4">
                        {/* Controles de Quantidade */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantidadeChange(item.id, Math.max(0, item.quantidade_separada - 1))}
                            disabled={item.quantidade_separada <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={item.quantidade_total}
                              value={item.quantidade_separada}
                              onChange={(e) => handleQuantidadeChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <span className="text-sm text-muted-foreground">/ {item.quantidade_total}</span>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantidadeChange(item.id, Math.min(item.quantidade_total, item.quantidade_separada + 1))}
                            disabled={item.quantidade_separada >= item.quantidade_total}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Botão Scanner */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setItemSelecionado(item.id)
                            setShowScanner(true)
                          }}
                          disabled={isCompleto}
                          className="flex items-center gap-2"
                        >
                          <Scan className="h-4 w-4" />
                          Scanner
                        </Button>

                        {/* Botão Separar Tudo */}
                        <Button
                          size="sm"
                          onClick={() => handleQuantidadeChange(item.id, item.quantidade_total)}
                          disabled={isCompleto}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Separar Tudo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Botão Finalizar */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              
              <Button
                onClick={handleFinalizarSeparacao}
                disabled={!podeFinalizarSeparacao() || finalizarSeparacao.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {finalizarSeparacao.isPending ? 'Finalizando...' : 'Finalizar Separação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner de Código de Barras */}
      {showScanner && itemSelecionado && (
        <ScannerCodigoBarras
          open={showScanner}
          onClose={() => {
            setShowScanner(false)
            setItemSelecionado(null)
          }}
          onSuccess={() => handleScanSuccess(itemSelecionado)}
          itemId={itemSelecionado}
        />
      )}
    </>
  )
}