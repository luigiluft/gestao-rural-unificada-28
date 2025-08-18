import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Scan, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ScannerCodigoBarrasProps {
  open: boolean
  onClose: () => void
  onSuccess: (codigo: string) => void
  itemId: string
}

export function ScannerCodigoBarras({ open, onClose, onSuccess, itemId }: ScannerCodigoBarrasProps) {
  const [codigo, setCodigo] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCodigo('')
      setLastScanned(null)
      setIsScanning(false)
    }
  }, [open])

  // Simular escaneamento automático (em uma implementação real, isso seria integrado com uma biblioteca de câmera/scanner)
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        const codigoSimulado = `BAR${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        setCodigo(codigoSimulado)
        setLastScanned(codigoSimulado)
        setIsScanning(false)
        toast.success('Código de barras escaneado!')
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isScanning])

  const handleManualSubmit = () => {
    if (codigo.trim()) {
      handleConfirm(codigo.trim())
    } else {
      toast.error('Digite um código válido')
    }
  }

  const handleConfirm = (codigoConfirmado: string) => {
    // Aqui você pode adicionar validação do código de barras
    // Por exemplo, verificar se o código corresponde ao produto esperado
    
    onSuccess(codigoConfirmado)
    toast.success('Produto separado via código de barras!')
    onClose()
  }

  const startScanning = () => {
    setIsScanning(true)
    toast.info('Escaneando... Aproxime o código de barras da câmera')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner de Código de Barras
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scanner Visual */}
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {isScanning ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                      <Scan className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Escaneando código de barras...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Scan className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clique para iniciar o scanner ou digite o código manualmente
                    </p>
                    <Button
                      onClick={startScanning}
                      className="w-full"
                      disabled={isScanning}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Iniciar Scanner
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entrada Manual */}
          <div className="space-y-3">
            <Label htmlFor="codigo-manual">Ou digite o código manualmente:</Label>
            <div className="flex gap-2">
              <Input
                id="codigo-manual"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Digite ou escaneie o código de barras"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit()
                  }
                }}
                disabled={isScanning}
              />
              <Button 
                onClick={handleManualSubmit}
                disabled={!codigo.trim() || isScanning}
                size="sm"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Último código escaneado */}
          {lastScanned && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Último código: <code className="font-mono">{lastScanned}</code>
                </span>
              </div>
            </div>
          )}

          {/* Info sobre scanner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Como usar:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Use o scanner automático para códigos de barras</li>
                  <li>• Digite manualmente se preferir</li>
                  <li>• Cada escaneamento adiciona 1 unidade ao item</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            {codigo && (
              <Button 
                onClick={() => handleConfirm(codigo)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirmar Código
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}