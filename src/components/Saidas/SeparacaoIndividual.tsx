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
  const [itemAtualIndex, setItemAtualIndex] = useState(0)
  
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
      setItemAtualIndex(0)
    }
  }, [saida, open, inicializarSeparacao])

  useEffect(() => {
    // Auto abrir scanner quando abrir o modal e houver itens
    if (open && itensSeparacao.length > 0) {
      setShowScanner(true)
    }
  }, [open, itensSeparacao.length])

  const itemAtual = itensSeparacao[itemAtualIndex]

  const handleQuantidadeChange = (itemId: string, novaQuantidade: number) => {
    atualizarQuantidadeSeparada(itemId, novaQuantidade)
    separarItem.mutate({ itemId, quantidadeSeparada: novaQuantidade })
    
    // Se completou o item atual, ir para o próximo
    const item = itensSeparacao.find(i => i.id === itemId)
    if (item && novaQuantidade >= item.quantidade_total) {
      const proximoIncompleto = itensSeparacao.findIndex((item, index) => 
        index > itemAtualIndex && item.quantidade_separada < item.quantidade_total
      )
      if (proximoIncompleto !== -1) {
        setItemAtualIndex(proximoIncompleto)
      }
    }
  }

  const handleScanSuccess = () => {
    if (itemAtual && itemAtual.quantidade_separada < itemAtual.quantidade_total) {
      const novaQuantidade = itemAtual.quantidade_separada + 1
      handleQuantidadeChange(itemAtual.id, novaQuantidade)
    }
  }

  const handleProximoItem = () => {
    const proximoIndex = itemAtualIndex + 1
    if (proximoIndex < itensSeparacao.length) {
      setItemAtualIndex(proximoIndex)
    }
  }

  const handleItemAnterior = () => {
    const anteriorIndex = itemAtualIndex - 1
    if (anteriorIndex >= 0) {
      setItemAtualIndex(anteriorIndex)
    }
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

            {/* Item Atual para Separação */}
            {itemAtual && (
              <Card className="border-2 border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Item {itemAtualIndex + 1} de {itensSeparacao.length}
                        </Badge>
                        <h3 className="font-semibold text-lg">{itemAtual.produto_nome}</h3>
                      </div>
                      {itemAtual.lote && (
                        <p className="text-sm text-muted-foreground">Lote: {itemAtual.lote}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleItemAnterior}
                        disabled={itemAtualIndex === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleProximoItem}
                        disabled={itemAtualIndex === itensSeparacao.length - 1}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {itemAtual.quantidade_separada} / {itemAtual.quantidade_total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {itemAtual.unidade_medida} separadas
                    </div>
                  </div>

                  <Progress 
                    value={(itemAtual.quantidade_separada / itemAtual.quantidade_total) * 100} 
                    className="h-3" 
                  />

                  <div className="flex items-center justify-center gap-4">
                    {/* Separação Manual */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantidadeChange(itemAtual.id, Math.max(0, itemAtual.quantidade_separada - 1))}
                        disabled={itemAtual.quantidade_separada <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantidadeChange(itemAtual.id, Math.min(itemAtual.quantidade_total, itemAtual.quantidade_separada + 1))}
                        disabled={itemAtual.quantidade_separada >= itemAtual.quantidade_total}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => setShowScanner(!showScanner)}
                      className="flex items-center gap-2"
                    >
                      <Scan className="h-4 w-4" />
                      {showScanner ? 'Parar Scanner' : 'Ativar Scanner'}
                    </Button>
                  </div>

                  {itemAtual.quantidade_separada >= itemAtual.quantidade_total && (
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-medium">Item Completo!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lista de Todos os Itens - Resumo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo dos Itens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {itensSeparacao.map((item, index) => {
                    const isCompleto = item.quantidade_separada >= item.quantidade_total
                    const isCurrent = index === itemAtualIndex

                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                          isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                        } ${isCompleto ? 'bg-green-50/50' : ''}`}
                        onClick={() => setItemAtualIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          {isCompleto ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{item.produto_nome}</p>
                            {item.lote && (
                              <p className="text-xs text-muted-foreground">{item.lote}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantidade_separada}/{item.quantidade_total}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

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
      {showScanner && itemAtual && (
        <ScannerCodigoBarras
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onSuccess={handleScanSuccess}
          itemId={itemAtual.id}
          produtoNome={itemAtual.produto_nome}
          quantidadeRestante={itemAtual.quantidade_total - itemAtual.quantidade_separada}
        />
      )}
    </>
  )
}