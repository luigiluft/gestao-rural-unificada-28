import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PalletInfo } from "@/components/Alocacao/PalletInfo"
import { PalletProductsCheck } from "@/components/Alocacao/PalletProductsCheck"
import { ProgressIndicator } from "@/components/Alocacao/ProgressIndicator"
import { usePalletAllocation } from "@/hooks/usePalletAllocation"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Package, SkipForward, Scan, ArrowLeft } from "lucide-react"

export default function AlocacaoComColetor() {
  const { waveId } = useParams<{ waveId: string }>()
  const { toast } = useToast()
  
  const {
    wave,
    isLoading,
    currentPallet,
    currentPosition,
    pendingPallets,
    currentPalletIndex,
    isProcessing,
    productsStatus,
    conferenciaMode,
    allProductsChecked,
    handleAllocatePallet,
    handleSkipPallet,
    updateProductStatus,
    startConferencia,
    setConferenciaMode,
    navigate
  } = usePalletAllocation(waveId!)

  const [scannedPalletCode, setScannedPalletCode] = useState("")
  const [scannedPositionCode, setScannedPositionCode] = useState("")

  // Auto-iniciar conferência ao carregar a página
  useEffect(() => {
    if (currentPallet && !conferenciaMode) {
      startConferencia()
    }
  }, [currentPallet, conferenciaMode, startConferencia])

  // Simular scanner via teclado (F1 para pallet, F2 para posição)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        const mockPalletCode = currentPallet?.codigo_barras_pallet || `PALLET-${Date.now()}`
        setScannedPalletCode(mockPalletCode)
      } else if (e.key === "F2") {
        e.preventDefault()
        const mockPositionCode = currentPosition?.codigo || `POS-${Date.now()}`
        setScannedPositionCode(mockPositionCode)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentPallet, currentPosition])

  // Auto-alocar quando ambos os códigos forem escaneados, todos os produtos conferidos e corresponderem
  useEffect(() => {
    if (
      scannedPalletCode && 
      scannedPositionCode && 
      currentPallet &&
      currentPosition &&
      allProductsChecked &&
      !isProcessing
    ) {
      // Verificar se os códigos correspondem aos esperados
      const expectedPalletCode = currentPallet.codigo_barras_pallet
      const expectedPositionCode = currentPosition.codigo

      if (scannedPalletCode === expectedPalletCode && scannedPositionCode === expectedPositionCode) {
        handleAllocatePallet(scannedPalletCode, scannedPositionCode)
        setScannedPalletCode("")
        setScannedPositionCode("")
      }
    }
  }, [scannedPalletCode, scannedPositionCode, currentPallet, currentPosition, allProductsChecked, isProcessing, handleAllocatePallet])

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

  // Se todos os pallets foram alocados
  if (pendingPallets.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Alocação Concluída!</h2>
            <p className="text-muted-foreground mb-4">
              Todos os pallets foram alocados com sucesso.
            </p>
            <Button onClick={() => navigate("/ondas-alocacao")}>
              Voltar para Ondas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentPallet) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pallet não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar o pallet atual da onda.
            </p>
            <Button onClick={() => navigate("/ondas-alocacao")}>
              Voltar para Ondas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/ondas-alocacao")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Conferência de Pallets</h1>
          <p className="text-muted-foreground">
            Onda: {wave?.numero_onda} - {wave?.franquia_nome}
          </p>
        </div>
        <ProgressIndicator
          currentIndex={currentPalletIndex}
          totalItems={pendingPallets.length}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Pallet */}
        <div className="space-y-4">
          <PalletInfo
            pallet={currentPallet}
            currentIndex={currentPalletIndex}
            totalPallets={pendingPallets.length}
          />

          {conferenciaMode && (
            <PalletProductsCheck
              products={productsStatus}
              onUpdateProduct={updateProductStatus}
            />
          )}
        </div>

        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner de Códigos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!conferenciaMode ? (
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="palletCode">Código do Pallet</Label>
                  <Input
                    id="palletCode"
                    placeholder="Escaneie o código do pallet"
                    value={scannedPalletCode}
                    onChange={(e) => setScannedPalletCode(e.target.value)}
                    className={
                      scannedPalletCode && scannedPalletCode === currentPallet.codigo_barras_pallet
                        ? "border-green-500 bg-green-50"
                        : scannedPalletCode
                        ? "border-red-500 bg-red-50"
                        : ""
                    }
                  />
                  {scannedPalletCode && (
                    <p className={`text-sm ${
                      scannedPalletCode === currentPallet.codigo_barras_pallet
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {scannedPalletCode === currentPallet.codigo_barras_pallet
                        ? "✓ Código correto"
                        : `✗ Esperado: ${currentPallet.codigo_barras_pallet}`
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionCode">Código da Posição</Label>
                  <Input
                    id="positionCode"
                    placeholder="Escaneie o código da posição"
                    value={scannedPositionCode}
                    onChange={(e) => setScannedPositionCode(e.target.value)}
                    className={
                      scannedPositionCode && scannedPositionCode === currentPosition?.codigo
                        ? "border-green-500 bg-green-50"
                        : scannedPositionCode
                        ? "border-red-500 bg-red-50"
                        : ""
                    }
                  />
                  {scannedPositionCode && (
                    <p className={`text-sm ${
                      scannedPositionCode === currentPosition?.codigo
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {scannedPositionCode === currentPosition?.codigo
                        ? "✓ Posição correta"
                        : `✗ Esperado: ${currentPosition?.codigo}`
                      }
                    </p>
                  )}
                </div>

                {!allProductsChecked && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">
                      Complete a conferência de todos os produtos antes de alocar o pallet
                    </p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Dicas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pressione F1 para simular scan do pallet</li>
                    <li>Pressione F2 para simular scan da posição</li>
                    <li>Complete a conferência dos produtos primeiro</li>
                    <li>A alocação acontece automaticamente quando tudo está correto</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSkipPallet}
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Pular Pallet
                  </Button>
                  <Button
                    onClick={() => setConferenciaMode(false)}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    Cancelar Conferência
                  </Button>
                </div>

                {isProcessing && (
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}