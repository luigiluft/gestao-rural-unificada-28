import { useParams } from "react-router-dom"
import { useEffect } from "react"
import { usePalletAllocation } from "@/hooks/usePalletAllocation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PalletInfo } from "@/components/Alocacao/PalletInfo"
import { PalletProductsCheck } from "@/components/Alocacao/PalletProductsCheck"
import { ProgressIndicator } from "@/components/Alocacao/ProgressIndicator"
import { CheckCircle, ArrowLeft, Package } from "lucide-react"

export default function AlocacaoManual() {
  const { waveId } = useParams()
  const {
    wave,
    isLoading,
    currentPallet,
    currentPosition,
    pendingPallets,
    currentPalletIndex,
    isProcessing,
    handleAllocatePallet,
    handleSkipPallet,
    navigate,
    allProductsChecked,
    updateProductStatus,
    productsStatus,
    startConferencia,
    conferenciaMode
  } = usePalletAllocation(waveId!)

  // Auto-iniciar conferência ao carregar a página
  useEffect(() => {
    if (currentPallet && !conferenciaMode) {
      startConferencia()
    }
  }, [currentPallet, conferenciaMode, startConferencia])

  const handleManualAllocate = async () => {
    if (!currentPallet || !currentPosition || !allProductsChecked) return
    await handleAllocatePallet(currentPallet.codigo_barras_pallet, currentPosition.codigo)
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

  if (!wave || !currentPallet) {
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
            <h2 className="text-2xl font-bold mb-2">Todos os pallets foram alocados!</h2>
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
          <h1 className="text-3xl font-bold">Alocação Manual - {wave.numero_onda}</h1>
          <p className="text-muted-foreground">
            Pallet {currentPalletIndex + 1} de {pendingPallets.length} • Modo Manual
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pallet Info */}
            <PalletInfo 
              pallet={currentPallet}
              currentIndex={currentPalletIndex}
              totalPallets={pendingPallets.length}
              currentPosition={currentPosition}
            />

        {/* Product Check & Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Conferência Manual dos Produtos
            </CardTitle>
            <CardDescription>
              Confira manualmente os produtos do pallet antes da alocação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentPosition ? (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-destructive mb-2">Posição não definida</p>
                    <p className="text-destructive/80">
                      Este pallet não tem uma posição de armazenamento definida. 
                      Retorne à página de ondas e redefina as posições automaticamente.
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate("/ondas-alocacao")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar e Redefinir Posições
                </Button>
              </div>
            ) : !conferenciaMode ? (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                </div>
                <p className="text-muted-foreground">
                  Iniciando conferência automática...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <PalletProductsCheck 
                  products={productsStatus}
                  onUpdateProduct={updateProductStatus}
                />
                
                <div className="pt-4 space-y-2 border-t">
                  <Button 
                    onClick={handleManualAllocate}
                    disabled={isProcessing || !allProductsChecked}
                    className="w-full"
                    variant="default"
                    size="lg"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processando..." : "✓ Confirmar Alocação do Pallet"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleSkipPallet}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Pular Pallet
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProgressIndicator currentIndex={currentPalletIndex} totalItems={pendingPallets.length} />
    </div>
  )
}