import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Scan, CheckCircle, Minus, Plus, AlertTriangle, Clock } from 'lucide-react'
import { useSeparacaoItens, ItemSeparacao } from '@/hooks/useSeparacaoItens'
import { ScannerCodigoBarras } from './ScannerCodigoBarras'
import { ScannerPalletBarcode } from './ScannerPalletBarcode'

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SeparacaoIndividualProps {
  saida: any
  open: boolean
  onClose: () => void
}

export function SeparacaoIndividual({ saida, open, onClose }: SeparacaoIndividualProps) {
  const [showPalletScanner, setShowPalletScanner] = useState(false)
  const [itemAtualIndex, setItemAtualIndex] = useState(0)
  
  const {
    itensSeparacao,
    separarItem,
    finalizarSeparacao,
    atualizarQuantidadeSeparada,
    inicializarSeparacao,
    marcarPalletEscaneado
  } = useSeparacaoItens()

  // Evitar re-inicializações que resetam quantidades
  const lastInitSaidaIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (open && saida?.id) {
      if (lastInitSaidaIdRef.current !== saida.id) {
        inicializarSeparacao(saida.saida_itens || [], saida.deposito_id)
        setItemAtualIndex(0)
        lastInitSaidaIdRef.current = saida.id
      }
    } else {
      // Ao fechar, permite inicializar novamente quando abrir outra saída
      lastInitSaidaIdRef.current = null
    }
  }, [open, saida?.id])

  // Removido: não abrir scanner automaticamente

  const itemAtual = itensSeparacao[itemAtualIndex]

  // Função para obter ícone do status de separação
  const getStatusIcon = (item: any) => {
    const isCompleto = item.quantidade_separada >= item.quantidade_total;
    if (isCompleto) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return <Clock className="h-4 w-4 text-warning" />;
  }

  // Função para obter variante do badge de status
  const getStatusVariant = (item: any) => {
    const isCompleto = item.quantidade_separada >= item.quantidade_total;
    if (isCompleto) {
      return 'default' as const;
    }
    return 'secondary' as const;
  }

  const handleQuantidadeChange = (itemId: string, novaQuantidade: number) => {
    const item = itensSeparacao.find(i => i.id === itemId);
    // Só permite aumentar se o pallet foi escaneado
    if (item && novaQuantidade > item.quantidade_separada && !item.pallet_escaneado) {
      return;
    }
    atualizarQuantidadeSeparada(itemId, novaQuantidade)
  }

  const handleConfirmarItem = async () => {
    if (itemAtual && itemAtual.quantidade_separada > 0) {
      // Persistir a separação no banco
      await separarItem.mutateAsync({
        itemId: itemAtual.id,
        quantidadeSeparada: itemAtual.quantidade_separada,
        lote: itemAtual.lote
      })
      
      // Navegar automaticamente para próximo item incompleto
      const proximoIncompleto = itensSeparacao.findIndex((item, index) => 
        index > itemAtualIndex && item.quantidade_separada < item.quantidade_total
      )
      if (proximoIncompleto !== -1) {
        setItemAtualIndex(proximoIncompleto)
      }
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
    if (podeFinalizarSeparacao() && saida?.id) {
      await finalizarSeparacao.mutateAsync({ saidaId: saida.id })
      onClose()
    }
  }

  const handleSimularEscaneamento = () => {
    if (!itemAtual) return;
    marcarPalletEscaneado(itemAtual.id, true);
  };

  const handlePalletConfirmado = () => {
    if (!itemAtual) return;
    marcarPalletEscaneado(itemAtual.id, true);
    setShowPalletScanner(false);
  };

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
            {/* Lista de Todos os Itens - Resumo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo dos Itens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {itensSeparacao.map((item, index) => {
                    const isCompleto = item.quantidade_separada >= item.quantidade_total
                    const isCurrent = index === itemAtualIndex

                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          isCurrent ? 'border-primary bg-primary/10' : 'border-border'
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
                              <p className="text-xs text-muted-foreground">Lote: {item.lote}</p>
                            )}
                            <div className="flex items-center gap-2">
                              {item.sugestao_fefo && (
                                <Badge variant="outline" className="text-xs w-fit mt-1">
                                  SUGERIDO - FEFO: {item.sugestao_fefo.posicao_codigo}
                                </Badge>
                              )}
                              {item.pallet_escaneado && (
                                <Badge variant="default" className="text-xs bg-green-600 mt-1">
                                  ✓ Pallet OK
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isCompleto ? "default" : "secondary"} className="text-xs">
                            {item.quantidade_separada} / {item.quantidade_total}
                          </Badge>
                          {getStatusIcon(item)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{itensSeparacao.filter(item => item.quantidade_separada >= item.quantidade_total).length} de {itensSeparacao.length} itens</span>
                    <span>{itensSeparacao.filter(item => item.quantidade_separada >= item.quantidade_total).length === itensSeparacao.length ? 'Concluído' : 'Em andamento'}</span>
                  </div>
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
                  {/* Sugestão FEFO */}
                  {itemAtual.sugestao_fefo && (
                    <div className="border-l-4 border-l-primary bg-primary/5 rounded-r-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">SUGERIDO - FEFO</Badge>
                          {getStatusIcon(itemAtual)}
                        </div>
                        {itemAtual.sugestao_fefo.dias_para_vencer !== undefined && (
                          <Badge variant={getStatusVariant(itemAtual.sugestao_fefo.status_validade)}>
                            {itemAtual.sugestao_fefo.dias_para_vencer <= 0 
                              ? 'VENCIDO' 
                              : `${itemAtual.sugestao_fefo.dias_para_vencer} dias`
                            }
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Posição:</span>
                          <p className="font-mono text-lg">{itemAtual.sugestao_fefo.posicao_codigo}</p>
                        </div>
                        {itemAtual.sugestao_fefo.lote && (
                          <div>
                            <span className="font-medium">Lote:</span>
                            <p className="font-mono">{itemAtual.sugestao_fefo.lote}</p>
                          </div>
                        )}
                        {itemAtual.sugestao_fefo.data_validade && (
                          <div className="col-span-2">
                            <span className="font-medium">Validade:</span>
                            <p>{format(new Date(itemAtual.sugestao_fefo.data_validade), "dd/MM/yyyy", { locale: ptBR })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Indicador de status do pallet */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {itemAtual.pallet_escaneado && (
                      <Badge variant="default" className="bg-green-600">
                        ✓ Pallet Confirmado
                      </Badge>
                    )}
                    {!itemAtual.pallet_escaneado && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        ⚠️ Pallet não escaneado
                      </Badge>
                    )}
                  </div>

                  {/* Scanner Pallet - Acima do display de quantidade */}
                  <div className="flex gap-2 justify-center mb-4">
                    <Button
                      variant="default"
                      onClick={() => setShowPalletScanner(true)}
                      className="flex items-center justify-center gap-2 py-4 px-6"
                    >
                      <Package className="h-5 w-5" />
                      Scanner Pallet
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleSimularEscaneamento}
                      disabled={itemAtual.pallet_escaneado}
                      className="flex items-center justify-center gap-2 py-4 px-6"
                    >
                      🧪 Simular Escaneamento
                    </Button>
                  </div>

                  {/* Controles de Quantidade Reorganizados */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {/* Botão Menos - Esquerda */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantidadeChange(itemAtual.id, Math.max(0, itemAtual.quantidade_separada - 1))}
                      disabled={itemAtual.quantidade_separada <= 0}
                      className="h-10 w-10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    {/* Display Central */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {itemAtual.quantidade_separada} / {itemAtual.quantidade_total}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {itemAtual.unidade_medida} separadas
                      </div>
                    </div>

                    {/* Botão Mais - Direita (3x maior) */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleQuantidadeChange(itemAtual.id, Math.min(itemAtual.quantidade_total, itemAtual.quantidade_separada + 1))}
                      disabled={itemAtual.quantidade_separada >= itemAtual.quantidade_total || !itemAtual.pallet_escaneado}
                      className={`h-16 w-16 ${!itemAtual.pallet_escaneado ? "opacity-50" : ""}`}
                      title={!itemAtual.pallet_escaneado ? "Escaneie o pallet primeiro" : ""}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>

                  <Progress 
                    value={(itemAtual.quantidade_separada / itemAtual.quantidade_total) * 100} 
                    className="h-3 mb-4" 
                  />

                  {/* Botão Confirmar */}
                  <div className="text-center">
                    <Button
                      onClick={handleConfirmarItem}
                      disabled={itemAtual.quantidade_separada === 0 || separarItem.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {separarItem.isPending ? 'Confirmando...' : 'Confirmar'}
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

      {/* Scanner de Código de Barras - Pallets */}
      {showPalletScanner && itemAtual && (
        <ScannerPalletBarcode
          open={showPalletScanner}
          onClose={() => setShowPalletScanner(false)}
          saidaItemId={itemAtual.id}
          produtoId={itemAtual.produto_id}
          produtoNome={itemAtual.produto_nome}
          quantidadeRestante={itemAtual.quantidade_total - itemAtual.quantidade_separada}
          onPalletConfirmado={handlePalletConfirmado}
          onSeparacaoSuccess={(quantidade) => {
            const novaQuantidade = itemAtual.quantidade_separada + quantidade
            atualizarQuantidadeSeparada(itemAtual.id, novaQuantidade)
            
            // Se completou o item atual, ir para o próximo
            if (novaQuantidade >= itemAtual.quantidade_total) {
              const proximoIncompleto = itensSeparacao.findIndex((item, index) => 
                index > itemAtualIndex && item.quantidade_separada < item.quantidade_total
              )
              if (proximoIncompleto !== -1) {
                setItemAtualIndex(proximoIncompleto)
              }
            }
          }}
        />
      )}
    </>
  )
}