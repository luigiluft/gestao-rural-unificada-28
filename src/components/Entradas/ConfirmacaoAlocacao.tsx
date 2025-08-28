import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Package, MapPin, Scan, AlertTriangle } from "lucide-react";
import { useConfirmPalletAllocation, useCreateStockFromPallet, type PalletAllocationResult } from "@/hooks/usePalletPositions";

interface ConfirmacaoAlocacaoProps {
  allocation: PalletAllocationResult;
  onConfirmed: () => void;
  onCancel: () => void;
}

export default function ConfirmacaoAlocacao({ allocation, onConfirmed, onCancel }: ConfirmacaoAlocacaoProps) {
  const [codigoBarrasPallet, setCodigoBarrasPallet] = useState("");
  const [codigoBarrasPosicao, setCodigoBarrasPosicao] = useState("");
  const [scannerError, setScannerError] = useState("");

  const confirmAllocation = useConfirmPalletAllocation();
  const createStock = useCreateStockFromPallet();

  const handleManualConfirmation = async () => {
    try {
      await confirmAllocation.mutateAsync({
        palletId: allocation.pallet_id,
        positionId: allocation.posicao_id,
        method: 'manual'
      });
      
      await createStock.mutateAsync(allocation.pallet_id);
      onConfirmed();
    } catch (error) {
      console.error('Erro na confirmação manual:', error);
    }
  };

  const handleScannerConfirmation = async () => {
    setScannerError("");
    
    if (!codigoBarrasPallet.trim() || !codigoBarrasPosicao.trim()) {
      setScannerError("Por favor, escaneie tanto o pallet quanto a posição");
      return;
    }

    try {
      await confirmAllocation.mutateAsync({
        palletId: allocation.pallet_id,
        positionId: allocation.posicao_id,
        method: 'scanner',
        palletCode: codigoBarrasPallet,
        positionCode: codigoBarrasPosicao
      });
      
      await createStock.mutateAsync(allocation.pallet_id);
      onConfirmed();
    } catch (error) {
      console.error('Erro na confirmação por scanner:', error);
      setScannerError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const isLoading = confirmAllocation.isPending || createStock.isPending;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Confirmar Alocação de Pallet
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações da Alocação */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">Pallet:</span>
            <p className="text-sm">{allocation.pallet_codigo || allocation.pallet_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">Posição:</span>
            <p className="text-sm">{allocation.posicao_codigo || allocation.posicao_id}</p>
          </div>
          </div>
        </div>

        <Separator />

        {/* Métodos de Confirmação */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmação Manual
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Scanner de Código
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="text-center space-y-4">
              <div className="p-4 border-2 border-dashed border-primary rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Confirme que o pallet está fisicamente posicionado no local indicado:
                </p>
                <div className="flex justify-center items-center gap-4">
                  <Badge variant="outline" className="text-base p-2">
                    {allocation.pallet_codigo || allocation.pallet_id}
                  </Badge>
                  <span>→</span>
                  <Badge variant="outline" className="text-base p-2">
                    {allocation.posicao_codigo || allocation.posicao_id}
                  </Badge>
                </div>
              </div>
              
              <Button 
                onClick={handleManualConfirmation}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Confirmando..." : "Confirmar Alocação"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pallet-code">Código do Pallet</Label>
                  <Input
                    id="pallet-code"
                    placeholder={`Esperado: ${allocation.pallet_codigo || allocation.pallet_id}`}
                    value={codigoBarrasPallet}
                    onChange={(e) => setCodigoBarrasPallet(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position-code">Código da Posição</Label>
                  <Input
                    id="position-code"
                    placeholder={`Esperado: ${allocation.posicao_codigo || allocation.posicao_id}`}
                    value={codigoBarrasPosicao}
                    onChange={(e) => setCodigoBarrasPosicao(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {scannerError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{scannerError}</span>
                </div>
              )}

              <Button 
                onClick={handleScannerConfirmation}
                disabled={isLoading || !codigoBarrasPallet.trim() || !codigoBarrasPosicao.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Validando..." : "Validar e Confirmar"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Botões de Ação */}
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}