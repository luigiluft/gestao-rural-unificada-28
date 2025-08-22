import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAlocacao } from "@/hooks/useAlocacao"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductInfo } from "@/components/Alocacao/ProductInfo"
import { ProgressIndicator } from "@/components/Alocacao/ProgressIndicator"
import { Scan, MapPin, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AlocacaoComColetor() {
  const { waveId } = useParams()
  const { toast } = useToast()
  const {
    wave,
    isLoading,
    currentItem,
    currentPosition,
    pendingItems,
    currentItemIndex,
    isProcessing,
    handleAllocate,
    handleSkipItem,
    navigate
  } = useAlocacao(waveId!)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedProductCode, setScannedProductCode] = useState("")
  const [scannedPositionCode, setScannedPositionCode] = useState("")

  useEffect(() => {
    // Simulate barcode scanner integration
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F1') { // F1 to simulate product scan
        event.preventDefault()
        const productCode = currentItem?.entrada_itens?.codigo_produto || `PRODUTO-${currentItem?.produtos?.nome?.substring(0, 10) || 'SEM-CODIGO'}`
        setScannedProductCode(productCode)
        toast({
          title: "Produto escaneado",
          description: `Código: ${productCode}`,
        })
      }
      if (event.key === 'F2') { // F2 to simulate position scan
        event.preventDefault()
        if (currentPosition) {
          setScannedPositionCode(currentPosition.codigo)
          toast({
            title: "Posição escaneada",
            description: `Posição: ${currentPosition.codigo}`,
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentItem, currentPosition, toast])

  const handleScannerAllocate = async () => {
    if (!scannedProductCode || !scannedPositionCode) {
      toast({
        title: "Dados incompletos",
        description: "É necessário escanear tanto o produto quanto a posição",
        variant: "destructive",
      })
      return
    }

    // Validar se os códigos escaneados conferem com o esperado
    const expectedProductCode = currentItem?.entrada_itens?.codigo_produto || `PRODUTO-${currentItem?.produtos?.nome?.substring(0, 10) || 'SEM-CODIGO'}`
    const expectedPositionCode = currentPosition?.codigo

    if (scannedProductCode !== expectedProductCode) {
      toast({
        title: "Produto incorreto",
        description: `Produto escaneado não confere. Esperado: ${expectedProductCode}`,
        variant: "destructive",
      })
      return
    }

    if (scannedPositionCode !== expectedPositionCode) {
      toast({
        title: "Posição incorreta",
        description: `Posição escaneada não confere. Esperado: ${expectedPositionCode}`,
        variant: "destructive",
      })
      return
    }

    const success = await handleAllocate(scannedProductCode, scannedPositionCode)
    if (success) {
      // Reset form
      setScannedProductCode("")
      setScannedPositionCode("")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!wave || !currentItem) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/ondas-alocacao")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Alocação com Coletor</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Todos os itens foram alocados!</h2>
            <p className="text-muted-foreground mb-4">
              A onda {wave?.numero_onda} foi concluída com sucesso.
            </p>
            <Button onClick={() => navigate("/ondas-alocacao")}>
              Voltar para Ondas de Alocação
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/ondas-alocacao")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Alocação com Coletor - {wave.numero_onda}</h1>
          <p className="text-muted-foreground">
            Item {currentItemIndex + 1} de {pendingItems.length} • Modo Scanner/Coletor
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Info */}
        <div className="space-y-4">
          <ProductInfo currentItem={currentItem} />
          
          {/* Scanner Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Controles do Scanner</CardTitle>
              <CardDescription>
                Escaneie ou selecione o produto para confirmação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-medium">Selecionar Produto Manualmente</Label>
                <Select 
                  value={scannedProductCode} 
                  onValueChange={(value) => {
                    setScannedProductCode(value)
                    toast({
                      title: "Produto selecionado",
                      description: `Código: ${value}`,
                    })
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Escolher produto..." />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value={currentItem.entrada_itens?.codigo_produto || `PRODUTO-${currentItem?.produtos?.nome?.substring(0, 10) || 'SEM-CODIGO'}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{currentItem.produtos?.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {currentItem.lote ? `Lote: ${currentItem.lote}` : 'Sem lote'}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Código do Produto</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={scannedProductCode}
                    onChange={(e) => setScannedProductCode(e.target.value)}
                    placeholder="Escanear ou digitar código..."
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setScannerOpen(true)}
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dica: Pressione F1 para simular scan do produto
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Position Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Scanner de Posição
            </CardTitle>
            <CardDescription>
              Use o scanner para confirmar a posição designada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPosition ? (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scan className="w-5 h-5 text-blue-600" />
                    <Label className="font-medium text-blue-800">Posição para Scanner</Label>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{currentPosition.codigo}</p>
                  {currentPosition.descricao && (
                    <p className="text-sm text-blue-600 mt-1">
                      {currentPosition.descricao}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    📱 Escaneie ou pressione F2 para confirmar
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Scanner de Posição (F2)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      value={scannedPositionCode}
                      onChange={(e) => setScannedPositionCode(e.target.value)}
                      placeholder={`Pressione F2 ou escaneie: ${currentPosition.codigo}`}
                      className={scannedPositionCode && scannedPositionCode !== currentPosition.codigo ? 'border-destructive' : 'border-blue-300'}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setScannerOpen(true)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Scan className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    📱 Pressione F2 para simular scanner ou escaneie o código de barras
                  </p>
                  {scannedPositionCode && scannedPositionCode !== currentPosition.codigo && (
                    <p className="text-xs text-destructive mt-1">
                      ❌ Posição incorreta! Escaneie: {currentPosition.codigo}
                    </p>
                  )}
                  {scannedPositionCode && scannedPositionCode === currentPosition.codigo && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Posição confirmada pelo scanner!
                    </p>
                  )}
                </div>

                <div className="pt-6 space-y-2">
                  <Button 
                    onClick={handleScannerAllocate}
                    disabled={!scannedProductCode || !scannedPositionCode || isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processando..." : "📱 Confirmar Scanner - Produto + Posição"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleSkipItem}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Pular Item
                  </Button>
                </div>

                {(!scannedProductCode || !scannedPositionCode) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Atenção</p>
                      <p className="text-yellow-700">
                        É necessário escanear tanto o produto quanto a posição antes de confirmar.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Posição não definida</p>
                  <p className="text-red-700">
                    Este item ainda não tem uma posição automaticamente designada pelo sistema.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProgressIndicator currentIndex={currentItemIndex} totalItems={pendingItems.length} />

      {/* Scanner Modal */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanner de Código de Barras</DialogTitle>
            <DialogDescription>
              Funcionalidade de scanner será implementada aqui
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Scan className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Scanner de código de barras<br />
              (Funcionalidade será integrada com dispositivo físico)
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setScannerOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}