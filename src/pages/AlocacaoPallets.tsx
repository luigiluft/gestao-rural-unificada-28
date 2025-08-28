import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Calendar, User, Hash, Hand, Scan } from "lucide-react";
import { usePalletsPendentes, useAutoAllocatePallet, useConfirmPalletAllocation } from "@/hooks/usePalletPositions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlocacaoPallets() {
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [activePallet, setActivePallet] = useState<any>(null);
  const [allocationResult, setAllocationResult] = useState<any>(null);
  const [scannerData, setScannerData] = useState({
    palletCode: "",
    positionCode: ""
  });

  const { data: palletsPendentes, isLoading: loadingPallets } = usePalletsPendentes();
  const autoAllocatePallet = useAutoAllocatePallet();
  const confirmAllocation = useConfirmPalletAllocation();

  const handleStartManualAllocation = (pallet: any) => {
    setActivePallet(pallet);
    setActiveMethod("manual");
    
    autoAllocatePallet.mutate(
      { palletId: pallet.id, depositoId: pallet.entradas.deposito_id },
      {
        onSuccess: (result) => {
          if (result.success) {
            setAllocationResult(result);
          }
        }
      }
    );
  };

  const handleStartScannerAllocation = (pallet: any) => {
    setActivePallet(pallet);
    setActiveMethod("scanner");
    setScannerData({ palletCode: "", positionCode: "" });
    
    autoAllocatePallet.mutate(
      { palletId: pallet.id, depositoId: pallet.entradas.deposito_id },
      {
        onSuccess: (result) => {
          if (result.success) {
            setAllocationResult(result);
          }
        }
      }
    );
  };

  const handleManualConfirmation = () => {
    if (!allocationResult) return;
    
    confirmAllocation.mutate(
      {
        palletId: activePallet.id,
        positionId: allocationResult.posicao_id,
        method: "manual"
      },
      {
        onSuccess: () => {
          resetAllocationState();
        }
      }
    );
  };

  const handleScannerConfirmation = () => {
    if (!allocationResult || !scannerData.palletCode || !scannerData.positionCode) return;
    
    confirmAllocation.mutate(
      {
        palletId: activePallet.id,
        positionId: allocationResult.posicao_id,
        method: "scanner",
        palletCode: scannerData.palletCode,
        positionCode: scannerData.positionCode
      },
      {
        onSuccess: () => {
          resetAllocationState();
        }
      }
    );
  };

  const resetAllocationState = () => {
    setActiveMethod(null);
    setActivePallet(null);
    setAllocationResult(null);
    setScannerData({ palletCode: "", positionCode: "" });
  };

  if (loadingPallets) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Alocação de Pallets</h1>
            <p className="text-muted-foreground">Aloque pallets aprovados nas posições disponíveis</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Alocação de Pallets</h1>
          <p className="text-muted-foreground">Aloque pallets aprovados nas posições disponíveis</p>
        </div>
      </div>

      {!palletsPendentes?.length ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Nenhum pallet pendente"
          description="Todos os pallets foram alocados ou não há entradas aprovadas."
        />
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {palletsPendentes.length} pallet(s) pendente(s) de alocação
          </div>

          <div className="grid gap-4">
            {palletsPendentes.map((pallet) => (
              <Card key={pallet.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Pallet #{pallet.numero_pallet}
                      {pallet.descricao && (
                        <Badge variant="outline" className="text-xs">
                          {pallet.descricao}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={autoAllocatePallet.isPending || activeMethod === "manual"}
                          onClick={() => handleStartManualAllocation(pallet)}
                        >
                          <Hand className="h-4 w-4 mr-2" />
                          Alocar Manualmente
                        </Button>
                        <Button 
                          size="sm"
                          disabled={autoAllocatePallet.isPending || activeMethod === "scanner"}
                          onClick={() => handleStartScannerAllocation(pallet)}
                        >
                          <Scan className="h-4 w-4 mr-2" />
                          Alocar com Scanner
                        </Button>
                      </div>

                      {/* Seção de Confirmação Manual */}
                      {activeMethod === "manual" && activePallet?.id === pallet.id && allocationResult && (
                        <div className="mt-4 p-4 bg-muted rounded-lg border">
                          <h4 className="font-medium text-sm mb-2">Confirmação Manual</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Posição selecionada: <span className="font-medium">{allocationResult.posicao_codigo}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Coloque fisicamente o pallet na posição indicada e confirme abaixo.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={handleManualConfirmation}
                              disabled={confirmAllocation.isPending}
                            >
                              {confirmAllocation.isPending ? "Confirmando..." : "Confirmar que coloquei o pallet"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={resetAllocationState}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Seção de Confirmação com Scanner */}
                      {activeMethod === "scanner" && activePallet?.id === pallet.id && allocationResult && (
                        <div className="mt-4 p-4 bg-muted rounded-lg border">
                          <h4 className="font-medium text-sm mb-2">Confirmação com Scanner</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Posição selecionada: <span className="font-medium">{allocationResult.posicao_codigo}</span>
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="palletCode" className="text-sm">Código do Pallet</Label>
                              <Input
                                id="palletCode"
                                placeholder="Escaneie o código do pallet"
                                value={scannerData.palletCode}
                                onChange={(e) => setScannerData(prev => ({ ...prev, palletCode: e.target.value }))}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="positionCode" className="text-sm">Código da Posição</Label>
                              <Input
                                id="positionCode"
                                placeholder="Escaneie o código da posição"
                                value={scannerData.positionCode}
                                onChange={(e) => setScannerData(prev => ({ ...prev, positionCode: e.target.value }))}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm"
                                onClick={handleScannerConfirmation}
                                disabled={confirmAllocation.isPending || !scannerData.palletCode || !scannerData.positionCode}
                              >
                                {confirmAllocation.isPending ? "Confirmando..." : "Confirmar Escaneamento"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={resetAllocationState}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">NFe:</span>
                      <span>{pallet.entradas?.numero_nfe || "N/A"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Produtor:</span>
                      <span>Produtor</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Criado:</span>
                      <span>{format(new Date(pallet.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>

                    {pallet.peso_total && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Peso:</span>
                        <span>{pallet.peso_total}kg</span>
                      </div>
                    )}
                  </div>

                  {pallet.entrada_pallet_itens?.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Itens do Pallet ({pallet.entrada_pallet_itens.length})</h4>
                        <div className="grid gap-2 max-h-32 overflow-y-auto">
                          {pallet.entrada_pallet_itens.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm p-2 bg-muted rounded">
                              <span className="font-medium">
                                {item.entrada_itens?.nome_produto || "Produto sem nome"}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {item.quantidade} un
                              </Badge>
                            </div>
                          ))}
                          {pallet.entrada_pallet_itens.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              + {pallet.entrada_pallet_itens.length - 3} item(s) adicional(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}