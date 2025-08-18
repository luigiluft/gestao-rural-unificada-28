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
  onSuccess: () => void
  itemId: string
  produtoNome?: string
  quantidadeRestante?: number
}

export function ScannerCodigoBarras({ 
  open, 
  onClose, 
  onSuccess, 
  itemId, 
  produtoNome, 
  quantidadeRestante 
}: ScannerCodigoBarrasProps) {
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
    
    onSuccess()
    toast.success('Produto separado via código de barras!')
  }

  const startScanning = () => {
    setIsScanning(true)
    toast.info('Escaneando... Aproxime o código de barras da câmera')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner Ativo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {produtoNome && (
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold text-lg">{produtoNome}</h3>
                {quantidadeRestante !== undefined && (
                  <p className="text-muted-foreground">
                    Faltam {quantidadeRestante} unidades
                  </p>
                )}
              </div>
            )}

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-3">
                <Scan className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground">
                Escaneie o código de barras ou digite manualmente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de barras:</Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Digite ou escaneie o código"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit()
                    }
                  }}
                />
                <Button onClick={handleManualSubmit} disabled={!codigo.trim()}>
                  OK
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={onClose}>
                Parar Scanner
              </Button>
            </div>
          </div>
        </DialogContent>
    </Dialog>
  )
}