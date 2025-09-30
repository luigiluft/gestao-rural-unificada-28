import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hand, Scan } from "lucide-react";
import { useAutoAllocatePallet, useConfirmPalletAllocation } from "@/hooks/usePalletPositions";

interface AllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPallets: any[];
  method: "manual" | "scanner" | null;
}

export function AllocationDialog({ open, onOpenChange, selectedPallets, method }: AllocationDialogProps) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allocationResult, setAllocationResult] = useState<any>(null);
  const [scannerData, setScannerData] = useState({
    palletCode: "",
    positionCode: ""
  });
  const [customPosition, setCustomPosition] = useState("");
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const autoAllocatePallet = useAutoAllocatePallet();
  const confirmAllocation = useConfirmPalletAllocation();

  const currentPallet = selectedPallets[currentIndex];
  const isLastPallet = currentIndex === selectedPallets.length - 1;

  const startAllocation = () => {
    if (!currentPallet || !method) return;
    
    setIsProcessing(true);
    autoAllocatePallet.mutate({
      palletId: currentPallet.id,
      depositoId: currentPallet.entradas.deposito_id
    }, {
      onSuccess: result => {
        if (result.success) {
          setAllocationResult(result);
          setIsProcessing(false);
        }
      },
      onError: () => {
        setIsProcessing(false);
      }
    });
  };

  const confirmCurrentAllocation = async () => {
    if (!allocationResult || !currentPallet) return;

    const confirmData: any = {
      palletId: currentPallet.id,
      positionId: allocationResult.posicao_id,
      method
    };

    if (method === "scanner" && scannerData.palletCode && scannerData.positionCode) {
      confirmData.palletCode = scannerData.palletCode;
      confirmData.positionCode = scannerData.positionCode;
    }

    try {
      await confirmAllocation.mutateAsync(confirmData);
      
      // Reset states for next pallet
      setAllocationResult(null);
      setScannerData({ palletCode: "", positionCode: "" });
      setCustomPosition("");
      setIsEditingPosition(false);

      if (isLastPallet) {
        // Finished all pallets
        queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
        onOpenChange(false);
        resetDialog();
      } else {
        // Move to next pallet
        setCurrentIndex(prev => prev + 1);
        setTimeout(() => startAllocation(), 100);
      }
    } catch (error) {
      console.error("Erro na confirmação:", error);
    }
  };

  const resetDialog = () => {
    setCurrentIndex(0);
    setAllocationResult(null);
    setScannerData({ palletCode: "", positionCode: "" });
    setCustomPosition("");
    setIsEditingPosition(false);
    setIsProcessing(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  // Start allocation when dialog opens
  if (open && method && currentPallet && !allocationResult && !isProcessing) {
    startAllocation();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {method === "manual" ? <Hand className="h-5 w-5" /> : <Scan className="h-5 w-5" />}
            Alocação {method === "manual" ? "Manual" : "com Scanner"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Pallet {currentIndex + 1} de {selectedPallets.length}
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(((currentIndex + 1) / selectedPallets.length) * 100, 100)}%` }}
              />
            </div>
          </div>

          {currentPallet && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-3">
              <div>
                <h4 className="font-medium">Pallet #{currentPallet.numero_pallet}</h4>
                <p className="text-sm text-muted-foreground">
                  NFe: {currentPallet.entradas?.numero_nfe || 'S/N'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Entrada ID: {currentPallet.entradas?.id || 'N/A'}
                </p>
              </div>
              
              {/* Produtos no Pallet */}
              {currentPallet.entrada_pallet_itens && currentPallet.entrada_pallet_itens.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">Produtos neste pallet:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {currentPallet.entrada_pallet_itens.map((item: any, index: number) => (
                      <div key={index} className={`flex justify-between items-start text-xs p-2 rounded border ${
                        item.is_avaria ? 'bg-destructive/10 border-destructive/20' : 'bg-background'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium truncate">
                              {item.entrada_itens?.produtos?.nome || item.entrada_itens?.nome_produto || 'Produto sem nome'}
                            </p>
                            {item.is_avaria && (
                              <span className="text-destructive text-xs px-1 py-0.5 bg-destructive/20 rounded">
                                AVARIA
                              </span>
                            )}
                          </div>
                          {item.entrada_itens?.produtos?.codigo && (
                            <p className="text-muted-foreground">
                              Cód: {item.entrada_itens.produtos.codigo}
                            </p>
                          )}
                          {item.entrada_itens?.lote && (
                            <p className="text-muted-foreground">
                              Lote: {item.entrada_itens.lote}
                            </p>
                          )}
                          {item.entrada_itens?.data_validade && (
                            <p className="text-muted-foreground">
                              Válido até: {new Date(item.entrada_itens.data_validade).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <p className="font-medium">
                            {item.quantidade} {item.entrada_itens?.produtos?.unidade_medida || item.entrada_itens?.unidade_comercial || 'UN'}
                          </p>
                          {item.entrada_itens?.valor_unitario && (
                            <p className="text-muted-foreground">
                              R$ {item.entrada_itens.valor_unitario.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2
                              })}
                            </p>
                          )}
                          {item.entrada_itens?.valor_unitario && (
                            <p className="text-muted-foreground font-medium">
                              Total: R$ {(item.quantidade * item.entrada_itens.valor_unitario).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Total: {currentPallet.entrada_pallet_itens.length} item(ns)</span>
                    {currentPallet.entrada_pallet_itens.some((item: any) => item.is_avaria) && (
                      <span className="text-destructive">
                        {currentPallet.entrada_pallet_itens.filter((item: any) => item.is_avaria).length} avariado(s)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Buscando posição disponível...</p>
            </div>
          )}

          {allocationResult && (
            <div className="space-y-4">
              {method === "manual" ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coloque fisicamente o pallet na posição indicada e confirme.
                  </p>
                  <div className="mb-3">
                    <Label htmlFor="positionInput" className="text-sm">Posição</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="positionInput"
                        value={isEditingPosition ? customPosition : allocationResult.posicao_codigo}
                        onChange={e => setCustomPosition(e.target.value)}
                        readOnly={!isEditingPosition}
                        className="text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          if (isEditingPosition) {
                            setCustomPosition("");
                          } else {
                            setCustomPosition(allocationResult.posicao_codigo);
                          }
                          setIsEditingPosition(!isEditingPosition);
                        }}
                      >
                        {isEditingPosition ? "Cancelar" : "Trocar"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customPosition" className="text-sm">Posição</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="customPosition"
                        value={isEditingPosition ? customPosition : allocationResult.posicao_codigo}
                        onChange={e => setCustomPosition(e.target.value)}
                        readOnly={!isEditingPosition}
                        className="text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          if (isEditingPosition) {
                            setCustomPosition("");
                          } else {
                            setCustomPosition(allocationResult.posicao_codigo);
                          }
                          setIsEditingPosition(!isEditingPosition);
                        }}
                      >
                        {isEditingPosition ? "Cancelar" : "Trocar"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="palletCode" className="text-sm">Código do Pallet</Label>
                    <Input
                      id="palletCode"
                      placeholder="Escaneie o código do pallet"
                      value={scannerData.palletCode}
                      onChange={e => setScannerData(prev => ({ ...prev, palletCode: e.target.value }))}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="positionCode" className="text-sm">Código da Posição</Label>
                    <Input
                      id="positionCode"
                      placeholder="Escaneie o código da posição"
                      value={scannerData.positionCode}
                      onChange={e => setScannerData(prev => ({ ...prev, positionCode: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={confirmCurrentAllocation}
                  disabled={
                    confirmAllocation.isPending ||
                    isProcessing ||
                    (method === "scanner" && (!scannerData.palletCode || !scannerData.positionCode))
                  }
                  className="flex-1"
                  type="button"
                >
                  {confirmAllocation.isPending ? "Confirmando..." : "Confirmar Posicionamento"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                  disabled={confirmAllocation.isPending}
                  type="button"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}