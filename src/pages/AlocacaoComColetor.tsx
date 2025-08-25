import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAlocacao } from "@/hooks/useAlocacao"
import { useDefineWavePositions } from "@/hooks/useAllocationWaves"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductInfo } from "@/components/Alocacao/ProductInfo"
import { ProgressIndicator } from "@/components/Alocacao/ProgressIndicator"
import { Scan, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
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

  const defineWavePositions = useDefineWavePositions()

  const [scannedProductCode, setScannedProductCode] = useState("")
  const [scannedPositionCode, setScannedPositionCode] = useState("")

  const handleDefinePositions = async () => {
    if (!waveId) return
    await defineWavePositions.mutateAsync({ waveId })
  }

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

  // Auto-allocate when both codes are scanned correctly
  useEffect(() => {
    if (scannedProductCode && scannedPositionCode && !isProcessing) {
      const expectedProductCode = currentItem?.entrada_itens?.codigo_produto || `PRODUTO-${currentItem?.produtos?.nome?.substring(0, 10) || 'SEM-CODIGO'}`
      const expectedPositionCode = currentPosition?.codigo

      if (scannedProductCode === expectedProductCode && scannedPositionCode === expectedPositionCode) {
        handleAllocate(scannedProductCode, scannedPositionCode).then((success) => {
          if (success) {
            setScannedProductCode("")
            setScannedPositionCode("")
          }
        })
      }
    }
  }, [scannedProductCode, scannedPositionCode, currentItem, currentPosition, isProcessing, handleAllocate])

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
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Scanner de Produto
              </CardTitle>
              <CardDescription>
                Escaneie o código de barras do produto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-medium">Scanner de Produto (F1)</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={scannedProductCode}
                    onChange={(e) => setScannedProductCode(e.target.value)}
                    placeholder="Pressione F1 ou escaneie produto..."
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const productCode = currentItem.entrada_itens?.codigo_produto || `PRODUTO-${currentItem?.produtos?.nome?.substring(0, 10) || 'SEM-CODIGO'}`
                      setScannedProductCode(productCode)
                      toast({
                        title: "Produto simulado",
                        description: `Código: ${productCode}`,
                      })
                    }}
                    size="sm"
                  >
                    F1
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  📱 Pressione F1 para simular scanner ou escaneie o código de barras
                </p>
                {scannedProductCode && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Produto escaneado: {scannedProductCode}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Position Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Scanner de Posição
            </CardTitle>
            <CardDescription>
              Escaneie o código da posição designada
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
                      size="sm"
                      onClick={() => setScannedPositionCode(currentPosition.codigo)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      F2
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

                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={handleSkipItem}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Pular Item
                  </Button>
                  
                  <div className="text-center pt-3">
                    <p className="text-xs text-muted-foreground">
                      Modo Scanner: F1 para produto • F2 para posição
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ⚡ Alocação automática quando ambos forem escaneados corretamente
                    </p>
                  </div>
                </div>

                {(!scannedProductCode || !scannedPositionCode) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Aguardando Scanner</p>
                      <p className="text-yellow-700">
                        Escaneie primeiro o produto (F1) e depois a posição (F2) para alocar automaticamente.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">Posição não definida</p>
                    <p className="text-red-700">
                      Este item ainda não tem uma posição automaticamente designada pelo sistema.
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleDefinePositions}
                  disabled={defineWavePositions.isPending}
                  className="w-full"
                >
                  {defineWavePositions.isPending ? "Definindo Posições..." : "Definir Posições"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProgressIndicator currentIndex={currentItemIndex} totalItems={pendingItems.length} />
    </div>
  )
}