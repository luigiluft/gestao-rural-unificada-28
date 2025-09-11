import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Package, Scan, CheckCircle, AlertTriangle, Clock, Minus, Plus } from 'lucide-react'
import { usePalletBarcodeSeparacao } from '@/hooks/usePalletBarcodeSeparacao'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ScannerPalletBarcodeProps {
  open: boolean
  onClose: () => void
  saidaItemId: string
  produtoId: string
  produtoNome: string
  quantidadeRestante: number
  onSeparacaoSuccess: (quantidade: number) => void
}

export function ScannerPalletBarcode({ 
  open, 
  onClose, 
  saidaItemId,
  produtoId,
  produtoNome,
  quantidadeRestante,
  onSeparacaoSuccess 
}: ScannerPalletBarcodeProps) {
  const [codigoInput, setCodigoInput] = useState('')
  const [quantidadeASeparar, setQuantidadeASeparar] = useState(1)
  
  const {
    palletScaneado,
    buscarPalletPorCodigo,
    separarDoPallet,
    limparPalletScaneado
  } = usePalletBarcodeSeparacao()

  // Reset quando abrir o modal
  useEffect(() => {
    if (open) {
      setCodigoInput('')
      setQuantidadeASeparar(1)
      limparPalletScaneado()
    }
  }, [open, limparPalletScaneado])

  // Auto-focus no input quando abrir
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const input = document.getElementById('barcode-input')
        if (input) {
          input.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleScanearCodigo = async () => {
    if (!codigoInput.trim()) return
    
    try {
      await buscarPalletPorCodigo.mutateAsync(codigoInput.trim())
    } catch (error) {
      console.error('Erro ao escanear:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleScanearCodigo()
    }
  }

  const handleSeparar = async () => {
    if (!palletScaneado || quantidadeASeparar <= 0) return

    // Verificar se o produto do pallet coincide com o produto da saída
    if (palletScaneado.produto_id !== produtoId) {
      alert('⚠️ PRODUTO INCORRETO!\n\nO produto deste pallet não corresponde ao produto que deve ser separado.')
      return
    }

    try {
      await separarDoPallet.mutateAsync({
        palletId: palletScaneado.id,
        saidaItemId,
        quantidadeSeparada: quantidadeASeparar
      })
      
      onSeparacaoSuccess(quantidadeASeparar)
      
      // Se separou tudo que precisava ou o pallet ficou vazio, fechar
      if (quantidadeASeparar >= quantidadeRestante || palletScaneado.quantidade_atual <= quantidadeASeparar) {
        onClose()
      } else {
        // Resetar para próxima separação
        setCodigoInput('')
        setQuantidadeASeparar(Math.min(1, quantidadeRestante - quantidadeASeparar))
        limparPalletScaneado()
      }
    } catch (error) {
      console.error('Erro ao separar:', error)
    }
  }

  const getStatusIcon = (dataValidade?: string) => {
    if (!dataValidade) return <Package className="h-4 w-4 text-muted-foreground" />
    
    const agora = new Date()
    const validade = new Date(dataValidade)
    const diasParaVencer = Math.ceil((validade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasParaVencer <= 0) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    } else if (diasParaVencer <= 15) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    } else if (diasParaVencer <= 30) {
      return <Clock className="h-4 w-4 text-warning" />
    } else {
      return <CheckCircle className="h-4 w-4 text-success" />
    }
  }

  const getStatusText = (dataValidade?: string) => {
    if (!dataValidade) return null
    
    const agora = new Date()
    const validade = new Date(dataValidade)
    const diasParaVencer = Math.ceil((validade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasParaVencer <= 0) {
      return { text: 'VENCIDO', variant: 'destructive' as const }
    } else if (diasParaVencer <= 15) {
      return { text: `${diasParaVencer} dias - CRÍTICO`, variant: 'destructive' as const }
    } else if (diasParaVencer <= 30) {
      return { text: `${diasParaVencer} dias - ATENÇÃO`, variant: 'secondary' as const }
    } else {
      return { text: `${diasParaVencer} dias`, variant: 'default' as const }
    }
  }

  const maxQuantidade = Math.min(
    quantidadeRestante,
    palletScaneado?.quantidade_atual || 0
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner de Código de Pallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info do produto sendo separado */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Separando</Badge>
                  <span className="font-medium">{produtoNome}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quantidade restante: <span className="font-bold">{quantidadeRestante} unidades</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scanner Input */}
          <div className="space-y-3">
            <Label htmlFor="barcode-input">Escaneie ou digite o código do pallet</Label>
            <div className="flex gap-2">
              <Input
                id="barcode-input"
                placeholder="PLT12345678..."
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="font-mono"
                autoFocus
              />
              <Button 
                onClick={handleScanearCodigo}
                disabled={!codigoInput.trim() || buscarPalletPorCodigo.isPending}
              >
                {buscarPalletPorCodigo.isPending ? 'Buscando...' : 'Escanear'}
              </Button>
            </div>
          </div>

          {/* Informações do Pallet Escaneado */}
          {palletScaneado && (
            <Card className="border-2 border-primary">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">PALLET {palletScaneado.numero_pallet}</Badge>
                        {getStatusIcon(palletScaneado.data_validade)}
                      </div>
                      <h3 className="font-semibold text-lg">{palletScaneado.produto_nome}</h3>
                    </div>
                    {palletScaneado.data_validade && (
                      <Badge variant={getStatusText(palletScaneado.data_validade)?.variant}>
                        {getStatusText(palletScaneado.data_validade)?.text}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Código de Barras:</span>
                      <p className="font-mono text-lg">{palletScaneado.codigo_barras}</p>
                    </div>
                    <div>
                      <span className="font-medium">Quantidade Disponível:</span>
                      <p className="text-lg font-bold text-primary">{palletScaneado.quantidade_atual} unidades</p>
                    </div>
                    {palletScaneado.lote && (
                      <div>
                        <span className="font-medium">Lote:</span>
                        <p className="font-mono">{palletScaneado.lote}</p>
                      </div>
                    )}
                    {palletScaneado.posicao_codigo && (
                      <div>
                        <span className="font-medium">Posição:</span>
                        <p className="font-mono">{palletScaneado.posicao_codigo}</p>
                      </div>
                    )}
                    {palletScaneado.data_validade && (
                      <div className="col-span-2">
                        <span className="font-medium">Validade:</span>
                        <p>{format(new Date(palletScaneado.data_validade), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    )}
                  </div>

                  {/* Verificação de produto */}
                  {palletScaneado.produto_id !== produtoId && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">PRODUTO INCORRETO!</span>
                      </div>
                      <p className="text-sm text-destructive/80 mt-1">
                        Este pallet contém um produto diferente do que deve ser separado.
                      </p>
                    </div>
                  )}

                  {/* Controles de quantidade */}
                  {palletScaneado.produto_id === produtoId && (
                    <div className="space-y-3">
                      <Label>Quantidade a separar:</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantidadeASeparar(Math.max(1, quantidadeASeparar - 1))}
                          disabled={quantidadeASeparar <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={quantidadeASeparar}
                          onChange={(e) => setQuantidadeASeparar(Math.min(maxQuantidade, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-24 text-center"
                          min={1}
                          max={maxQuantidade}
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantidadeASeparar(Math.min(maxQuantidade, quantidadeASeparar + 1))}
                          disabled={quantidadeASeparar >= maxQuantidade}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setQuantidadeASeparar(maxQuantidade)}
                        >
                          Máximo ({maxQuantidade})
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {palletScaneado && palletScaneado.produto_id === produtoId && (
            <Button
              onClick={handleSeparar}
              disabled={separarDoPallet.isPending || quantidadeASeparar <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {separarDoPallet.isPending ? 'Separando...' : `Separar ${quantidadeASeparar} unidades`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}