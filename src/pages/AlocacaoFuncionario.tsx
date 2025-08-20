import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAllocationWaveById, useAllocateItem } from "@/hooks/useAllocationWaves"
import { useAvailablePositions } from "@/hooks/useStoragePositions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Scan, MapPin, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AlocacaoFuncionario() {
  const { waveId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: wave, isLoading } = useAllocationWaveById(waveId!)
  const { data: positions } = useAvailablePositions(wave?.deposito_id)
  const allocateItem = useAllocateItem()

  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedProductCode, setScannedProductCode] = useState("")
  const [scannedPositionCode, setScannedPositionCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const pendingItems = Array.isArray(wave?.allocation_wave_items) 
    ? wave.allocation_wave_items.filter((item: any) => item.status === 'pendente') 
    : []
  const currentItem = pendingItems[currentItemIndex]
  const currentPosition = currentItem?.storage_positions

  useEffect(() => {
    // Simulate barcode scanner integration
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F1') { // F1 to simulate product scan
        event.preventDefault()
        setScannedProductCode(currentItem?.entrada_itens?.codigo_produto || currentItem?.barcode_produto || currentItem?.lote || '')
        toast({
          title: "Produto escaneado",
          description: `Código: ${currentItem?.entrada_itens?.codigo_produto || currentItem?.barcode_produto || currentItem?.lote}`,
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

  const handleAllocate = async () => {
    if (!currentItem || !currentPosition || !scannedProductCode || !scannedPositionCode) {
      toast({
        title: "Dados incompletos",
        description: "É necessário escanear tanto o produto quanto a posição",
        variant: "destructive",
      })
      return
    }

    // Validar se os códigos escaneados conferem com o esperado
    const expectedProductCode = currentItem.entrada_itens?.codigo_produto || currentItem.barcode_produto || currentItem.lote
    const expectedPositionCode = currentPosition.codigo

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

    setIsProcessing(true)

    try {
      await allocateItem.mutateAsync({
        waveItemId: currentItem.id,
        posicaoId: currentItem.posicao_id,
        barcodeProduto: scannedProductCode,
        barcodePosicao: scannedPositionCode
      })

      // Reset form and move to next item
      setScannedProductCode("")
      setScannedPositionCode("")

      if (currentItemIndex < pendingItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
      } else {
        toast({
          title: "Alocação concluída",
          description: "Todos os itens foram alocados com sucesso!",
        })
        navigate("/ondas-alocacao")
      }
    } catch (error) {
      console.error("Error allocating item:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipItem = () => {
    if (currentItemIndex < pendingItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
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
          <h1 className="text-3xl font-bold">Alocação de Produtos</h1>
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
          <h1 className="text-3xl font-bold">Alocação - {wave.numero_onda}</h1>
          <p className="text-muted-foreground">
            Item {currentItemIndex + 1} de {pendingItems.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Item Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produto Atual
            </CardTitle>
            <CardDescription>
              Informações do produto para alocação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-medium">Nome do Produto</Label>
              <p className="text-lg">{currentItem.produtos?.nome}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-medium">Lote</Label>
                <p>{currentItem.lote || '-'}</p>
              </div>
              <div>
                <Label className="font-medium">Quantidade</Label>
                <p>{currentItem.quantidade} {currentItem.produtos?.unidade_medida}</p>
              </div>
            </div>

            {currentItem.entrada_itens && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Validade</Label>
                  <p>{currentItem.entrada_itens.data_validade ? 
                    new Date(currentItem.entrada_itens.data_validade).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <Label className="font-medium">Valor Unitário</Label>
                  <p>R$ {currentItem.entrada_itens.valor_unitario?.toFixed(2) || '0,00'}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-4">
              <div>
                <Label className="font-medium">Selecionar Produto Manualmente</Label>
                <Select 
                  value={scannedProductCode} 
                  onValueChange={(value) => {
                    setScannedProductCode(value)
                    toast({
                      title: "Produto selecionado",
                      description: `Código: ${currentItem?.entrada_itens?.codigo_produto || value}`,
                    })
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Escolher produto..." />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value={currentItem.entrada_itens?.codigo_produto || currentItem.barcode_produto || currentItem.lote || currentItem.produtos?.nome || ''}>
                      <div className="flex flex-col">
                        <span className="font-medium">{currentItem.produtos?.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {currentItem.lote ? `Lote: ${currentItem.lote}` : 'Sem lote'}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione o produto da lista para facilitar os testes
                </p>
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
            </div>
          </CardContent>
        </Card>

        {/* Position Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Posição Definida pelo Sistema
            </CardTitle>
            <CardDescription>
              Confirme a alocação escaneando a posição indicada
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

                <div>
                  <Label className="font-medium">Escanear Posição para Confirmar</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      value={scannedPositionCode}
                      onChange={(e) => setScannedPositionCode(e.target.value)}
                      placeholder={`Escaneie: ${currentPosition.codigo}`}
                      className={scannedPositionCode && scannedPositionCode !== currentPosition.codigo ? 'border-destructive' : ''}
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
                    Dica: Pressione F2 para simular scan da posição
                  </p>
                  {scannedPositionCode && scannedPositionCode !== currentPosition.codigo && (
                    <p className="text-xs text-destructive mt-1">
                      Posição incorreta! Escaneie: {currentPosition.codigo}
                    </p>
                  )}
                </div>

                <div className="pt-6 space-y-2">
                  <Button 
                    onClick={handleAllocate}
                    disabled={!scannedProductCode || !scannedPositionCode || isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Processando..." : "Confirmar Alocação"}
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

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Progresso da Alocação
            </span>
            <span className="text-sm text-muted-foreground">
              {currentItemIndex + 1} de {pendingItems.length}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentItemIndex + 1) / pendingItems.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scanner Modal (placeholder for future scanner integration) */}
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