import { useParams } from "react-router-dom"
import { useAlocacao } from "@/hooks/useAlocacao"
import { useResetWavePositions } from "@/hooks/useAllocationWaves"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductInfo } from "@/components/Alocacao/ProductInfo"
import { ProgressIndicator } from "@/components/Alocacao/ProgressIndicator"
import { MapPin, CheckCircle, ArrowLeft, Package, AlertCircle, RotateCcw } from "lucide-react"

export default function AlocacaoManual() {
  const { waveId } = useParams()
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

  const resetWavePositions = useResetWavePositions()

  const handleManualAllocate = async () => {
    if (!currentItem || !currentPosition) return

    const productCode = currentItem.entrada_itens?.codigo_produto || `PRODUTO-${currentItem?.produtos?.nome?.substring(0, 10) || 'SEM-CODIGO'}`
    const positionCode = currentPosition.codigo

    await handleAllocate(productCode, positionCode)
  }

  const handleResetPositions = async () => {
    if (!waveId) return
    await resetWavePositions.mutateAsync(waveId)
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
          <h1 className="text-3xl font-bold">Alocação Manual</h1>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/ondas-alocacao")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Alocação Manual - {wave.numero_onda}</h1>
            <p className="text-muted-foreground">
              Item {currentItemIndex + 1} de {pendingItems.length} • Modo Manual
            </p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleResetPositions}
          disabled={resetWavePositions.isPending}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {resetWavePositions.isPending ? "Resetando..." : "Resetar Posições"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Info */}
        <ProductInfo currentItem={currentItem} />

        {/* Position Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Posição Definida pelo Sistema
            </CardTitle>
            <CardDescription>
              Confirme a alocação do produto na posição indicada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPosition ? (
              <>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <Label className="font-medium text-primary">Posição Designada</Label>
                  </div>
                  <p className="text-2xl font-bold text-primary">{currentPosition.codigo}</p>
                  {currentPosition.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentPosition.descricao}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-green-800 mb-2">Alocação Manual</p>
                    <p className="text-green-700">
                      Clique no botão abaixo para confirmar manualmente o produto 
                      <span className="font-medium"> {currentItem.produtos?.nome} </span>
                      na posição <span className="font-medium">{currentPosition.codigo}</span>.
                    </p>
                    <p className="text-green-600 mt-2 text-xs">
                      ✓ Sem necessidade de scanner • ✓ Confirmação direta
                    </p>
                  </div>
                </div>

                <div className="pt-6 space-y-2">
                  <Button 
                    onClick={handleManualAllocate}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processando..." : "✓ Confirmar Alocação Manual"}
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
    </div>
  )
}