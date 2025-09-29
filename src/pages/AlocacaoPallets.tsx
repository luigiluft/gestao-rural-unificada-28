import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Calendar, User, Hash, Hand, Scan, CheckSquare, Square } from "lucide-react";
import { usePalletsPendentes, useAutoAllocatePallet, useConfirmPalletAllocation } from "@/hooks/usePalletPositions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlocacaoPallets() {
  const queryClient = useQueryClient();
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [activePallet, setActivePallet] = useState<any>(null);
  const [allocationResult, setAllocationResult] = useState<any>(null);
  const [scannerData, setScannerData] = useState({
    palletCode: "",
    positionCode: ""
  });
  const [customPosition, setCustomPosition] = useState("");
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  
  // Estados para seleção múltipla e ondas
  const [selectedPallets, setSelectedPallets] = useState<string[]>([]);
  const [isWaveMode, setIsWaveMode] = useState<string | null>(null);
  const [waveProgress, setWaveProgress] = useState<{ completed: number; total: number } | null>(null);
  const [waveResults, setWaveResults] = useState<any[]>([]);
  const [currentWaveIndex, setCurrentWaveIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPallets, setProcessedPallets] = useState<Set<string>>(new Set());

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
    setCustomPosition("");
    setIsEditingPosition(false);
  };

  const resetWaveState = () => {
    setIsWaveMode(null);
    setWaveProgress(null);
    setWaveResults([]);
    setCurrentWaveIndex(0);
    setSelectedPallets([]);
    setIsProcessing(false);
    setProcessedPallets(new Set());
  };

  // Funções de seleção múltipla
  const handleSelectPallet = (palletId: string, checked: boolean) => {
    setSelectedPallets(prev => 
      checked 
        ? [...prev, palletId]
        : prev.filter(id => id !== palletId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedPallets(checked ? palletsPendentes?.map(p => p.id) || [] : []);
  };

  // Funções de onda de alocação
  const handleWaveManualAllocation = () => {
    if (selectedPallets.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setIsWaveMode("manual");
    setWaveProgress({ completed: 0, total: selectedPallets.length });
    setWaveResults([]);
    setCurrentWaveIndex(0);
    setProcessedPallets(new Set());
    
    // Processar primeiro pallet da onda após breve delay
    setTimeout(processNextWavePallet, 100);
  };

  const handleWaveScannerAllocation = () => {
    if (selectedPallets.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setIsWaveMode("scanner");
    setWaveProgress({ completed: 0, total: selectedPallets.length });
    setWaveResults([]);
    setCurrentWaveIndex(0);
    setProcessedPallets(new Set());
    
    // Processar primeiro pallet da onda após breve delay
    setTimeout(processNextWavePallet, 100);
  };

  const processNextWavePallet = async () => {
    // Verificar se já estamos processando para evitar duplicatas
    if (isProcessing && autoAllocatePallet.isPending) {
      console.log("Processamento já em andamento, ignorando...");
      return;
    }

    // Calcular pallets restantes baseado na lista original menos os processados
    const remainingPallets = selectedPallets.filter(palletId => 
      !processedPallets.has(palletId) && 
      palletsPendentes?.find(p => p.id === palletId)
    );

    console.log("Remaining pallets:", remainingPallets.length, "Processed:", processedPallets.size);

    if (remainingPallets.length === 0) {
      console.log("Todos os pallets foram processados");
      const completedCount = waveProgress?.completed || 0;
      if (completedCount >= selectedPallets.length) {
        resetWaveState();
        resetAllocationState();
        queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
      }
      return;
    }

    // Pegar sempre o primeiro pallet não processado
    const currentPalletId = remainingPallets[0];
    const currentPallet = palletsPendentes?.find(p => p.id === currentPalletId);
    
    if (!currentPallet) {
      console.error("Pallet não encontrado:", currentPalletId);
      // Marcar como processado para pular
      setProcessedPallets(prev => new Set([...prev, currentPalletId]));
      setTimeout(processNextWavePallet, 100);
      return;
    }

    // Verificar se o pallet já foi processado (dupla verificação)
    if (processedPallets.has(currentPallet.id)) {
      console.log("Pallet já processado:", currentPallet.numero_pallet);
      setTimeout(processNextWavePallet, 100);
      return;
    }

    console.log("Processando pallet:", currentPallet.numero_pallet, "ID:", currentPallet.id);
    
    // Marcar como processando
    setProcessedPallets(prev => new Set([...prev, currentPallet.id]));
    
    autoAllocatePallet.mutate(
      { palletId: currentPallet.id, depositoId: currentPallet.entradas.deposito_id },
      {
        onSuccess: (result) => {
          console.log("Auto-alocação bem-sucedida:", result);
          if (result.success) {
            setWaveResults(prev => {
              // Verificar se já existe resultado para este pallet
              const existingIndex = prev.findIndex(r => r.pallet.id === currentPallet.id);
              if (existingIndex >= 0) {
                console.log("Resultado já existe, substituindo...");
                const newResults = [...prev];
                newResults[existingIndex] = { pallet: currentPallet, result };
                return newResults;
              }
              return [...prev, { pallet: currentPallet, result }];
            });
          }
        },
        onError: (error) => {
          console.error("Erro na auto-alocação:", error);
          // Remover da lista de processados em caso de erro
          setProcessedPallets(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentPallet.id);
            return newSet;
          });
          // Tentar próximo pallet após erro
          setTimeout(processNextWavePallet, 1000);
        }
      }
    );
  };

  const confirmWaveStep = async () => {
    if (confirmAllocation.isPending) {
      console.log("Confirmação já em andamento, ignorando...");
      return;
    }

    // Pegar o último resultado adicionado (pallet atual sendo processado)
    const currentResult = waveResults[waveResults.length - 1];
    
    if (!currentResult) {
      console.error("Nenhum resultado encontrado para confirmar");
      console.log("Wave results:", waveResults);
      console.log("Selected pallets:", selectedPallets);
      console.log("Processed pallets:", processedPallets);
      return;
    }

    console.log("Confirmando pallet:", currentResult.pallet.numero_pallet);

    const method = isWaveMode;
    const confirmData: any = {
      palletId: currentResult.pallet.id,
      positionId: currentResult.result.posicao_id,
      method
    };

    if (method === "scanner" && scannerData.palletCode && scannerData.positionCode) {
      confirmData.palletCode = scannerData.palletCode;
      confirmData.positionCode = scannerData.positionCode;
    }

    try {
      await confirmAllocation.mutateAsync(confirmData);
      
      console.log("Confirmação bem-sucedida para:", currentResult.pallet.numero_pallet);
      
      const newCompleted = waveProgress!.completed + 1;
      setWaveProgress(prev => prev ? { ...prev, completed: newCompleted } : null);
      
      // Remover o resultado processado somente após incrementar o progresso
      setWaveResults(prev => prev.filter(r => r.pallet.id !== currentResult.pallet.id));
      
      // Forçar atualização da query
      queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
      
      // Verificar se há mais pallets para processar baseado nos originalmente selecionados
      const remainingUnprocessed = selectedPallets.filter(id => 
        !processedPallets.has(id) && id !== currentResult.pallet.id
      );
      
      console.log("Remaining unprocessed pallets:", remainingUnprocessed.length);
      
      if (remainingUnprocessed.length > 0 && newCompleted < selectedPallets.length) {
        setScannerData({ palletCode: "", positionCode: "" });
        
        // Aguardar atualização antes de processar próximo
        setTimeout(async () => {
          await queryClient.refetchQueries({ queryKey: ["pallets-pendentes"] });
          processNextWavePallet();
        }, 800);
      } else {
        // Onda completa
        console.log("Onda completa!");
        resetWaveState();
        resetAllocationState();
        queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
      }
    } catch (error) {
      console.error("Erro na confirmação:", error);
      // Em caso de erro, remover da lista de processados para permitir reprocessamento
      setProcessedPallets(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentResult.pallet.id);
        return newSet;
      });
    }
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
          {/* Barra de ações da onda */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">{selectedPallets.length}</span> de{" "}
                <span className="font-medium">{palletsPendentes.length}</span> pallet(s) selecionado(s)
              </div>
              
              {selectedPallets.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPallets([])}
                >
                  Limpar Seleção
                </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                size="sm"
                variant="outline"
                disabled={selectedPallets.length === 0 || isWaveMode !== null || isProcessing}
                onClick={handleWaveManualAllocation}
                className="flex-shrink-0"
              >
                <Hand className="h-4 w-4 mr-2" />
                {isProcessing ? "Processando..." : "Alocar Manualmente"}
              </Button>
              <Button
                size="sm"
                disabled={selectedPallets.length === 0 || isWaveMode !== null || isProcessing}
                onClick={handleWaveScannerAllocation}
                className="flex-shrink-0"
              >
                <Scan className="h-4 w-4 mr-2" />
                {isProcessing ? "Processando..." : "Alocar com Scanner"}
              </Button>
            </div>
          </div>

          {/* Progresso da onda */}
          {waveProgress && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  Onda de Alocação {isWaveMode === "manual" ? "Manual" : "com Scanner"}
                </h3>
                <span className="text-sm font-medium">
                  {waveProgress.completed}/{waveProgress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(waveProgress.completed / waveProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Confirmação da onda atual */}
          {isWaveMode && waveResults.length > 0 && waveProgress && waveProgress.completed < waveProgress.total && (
            <div className="p-4 bg-muted rounded-lg border">
              {(() => {
                const currentResult = waveResults[waveResults.length - 1];
                return (
                  <div>
                    <h4 className="font-medium mb-2">
                      Pallet #{currentResult.pallet.numero_pallet} - {isWaveMode === "manual" ? "Confirmação Manual" : "Confirmação com Scanner"}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Posição: <span className="font-medium">{currentResult.result.posicao_codigo}</span>
                    </p>
                    
                    {isWaveMode === "manual" ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Coloque fisicamente o pallet na posição indicada e confirme.
                    </p>
                    <div className="mb-3">
                      <Label htmlFor="wavePositionInput" className="text-sm">Posição</Label>
                      <div className="flex gap-2">
                        <Input
                          id="wavePositionInput"
                          value={isEditingPosition ? customPosition : currentResult.result.posicao_codigo}
                          onChange={(e) => setCustomPosition(e.target.value)}
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
                              setCustomPosition(currentResult.result.posicao_codigo);
                            }
                            setIsEditingPosition(!isEditingPosition);
                          }}
                        >
                          {isEditingPosition ? "Cancelar" : "Trocar"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={confirmWaveStep}
                        disabled={confirmAllocation.isPending}
                      >
                        {confirmAllocation.isPending ? "Confirmando..." : "Confirmar Posicionamento"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={resetWaveState}
                      >
                        Cancelar Onda
                      </Button>
                    </div>
                  </div>
                    ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="wavepalletCode" className="text-sm">Código do Pallet</Label>
                        <Input
                          id="wavepalletCode"
                          placeholder="Escaneie o código do pallet"
                          value={scannerData.palletCode}
                          onChange={(e) => setScannerData(prev => ({ ...prev, palletCode: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wavepositionCode" className="text-sm">Código da Posição</Label>
                        <Input
                          id="wavepositionCode"
                          placeholder="Escaneie o código da posição"
                          value={scannerData.positionCode}
                          onChange={(e) => setScannerData(prev => ({ ...prev, positionCode: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="waveCustomPosition" className="text-sm">Posição</Label>
                        <div className="flex gap-2">
                          <Input
                            id="waveCustomPosition"
                            value={isEditingPosition ? customPosition : currentResult.result.posicao_codigo}
                            onChange={(e) => setCustomPosition(e.target.value)}
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
                                setCustomPosition(currentResult.result.posicao_codigo);
                              }
                              setIsEditingPosition(!isEditingPosition);
                            }}
                          >
                            {isEditingPosition ? "Cancelar" : "Trocar"}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm"
                          onClick={confirmWaveStep}
                          disabled={confirmAllocation.isPending || !scannerData.palletCode || !scannerData.positionCode}
                        >
                          {confirmAllocation.isPending ? "Confirmando..." : "Confirmar Escaneamento"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={resetWaveState}
                        >
                          Cancelar Onda
                        </Button>
                      </div>
                    </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tabela de pallets */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPallets.length === palletsPendentes.length}
                      onCheckedChange={handleSelectAll}
                      disabled={isWaveMode !== null}
                    />
                  </TableHead>
                  <TableHead>Pallet</TableHead>
                  <TableHead>NFe</TableHead>
                  <TableHead>Produtor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {palletsPendentes.map((pallet) => (
                  <TableRow key={pallet.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedPallets.includes(pallet.id)}
                        onCheckedChange={(checked) => handleSelectPallet(pallet.id, !!checked)}
                        disabled={isWaveMode !== null}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">#{pallet.numero_pallet}</span>
                        {pallet.descricao && (
                          <Badge variant="outline" className="text-xs">
                            {pallet.descricao}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {pallet.entradas?.numero_nfe || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>Produtor</TableCell>
                    <TableCell>
                      {format(new Date(pallet.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {pallet.peso_total ? `${pallet.peso_total}kg` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {pallet.entrada_pallet_itens?.length || 0} item(s)
                        </span>
                        {pallet.entrada_pallet_itens?.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {pallet.entrada_pallet_itens.slice(0, 2).map((item, i) => (
                              <div key={i}>
                                {item.entrada_itens?.nome_produto?.substring(0, 20)}...
                              </div>
                            ))}
                            {pallet.entrada_pallet_itens.length > 2 && (
                              <div>+{pallet.entrada_pallet_itens.length - 2} mais</div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={autoAllocatePallet.isPending || activeMethod === "manual" || isWaveMode !== null}
                          onClick={() => handleStartManualAllocation(pallet)}
                        >
                          <Hand className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm"
                          disabled={autoAllocatePallet.isPending || activeMethod === "scanner" || isWaveMode !== null}
                          onClick={() => handleStartScannerAllocation(pallet)}
                        >
                          <Scan className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Confirmação individual (quando não está em modo onda) */}
          {!isWaveMode && activeMethod && activePallet && allocationResult && (
            <div className="p-4 bg-muted rounded-lg border">
              <h4 className="font-medium text-sm mb-2">
                {activeMethod === "manual" ? "Confirmação Manual" : "Confirmação com Scanner"}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Pallet #{activePallet.numero_pallet} → Posição: <span className="font-medium">{allocationResult.posicao_codigo}</span>
              </p>
              
              {activeMethod === "manual" ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coloque fisicamente o pallet na posição indicada e confirme abaixo.
                  </p>
                  <div className="mb-3">
                    <Label htmlFor="individualPositionInput" className="text-sm">Posição</Label>
                    <div className="flex gap-2">
                      <Input
                        id="individualPositionInput"
                        value={isEditingPosition ? customPosition : allocationResult.posicao_codigo}
                        onChange={(e) => setCustomPosition(e.target.value)}
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
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="individualPalletCode" className="text-sm">Código do Pallet</Label>
                    <Input
                      id="individualPalletCode"
                      placeholder="Escaneie o código do pallet"
                      value={scannerData.palletCode}
                      onChange={(e) => setScannerData(prev => ({ ...prev, palletCode: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="individualPositionCode" className="text-sm">Código da Posição</Label>
                    <Input
                      id="individualPositionCode"
                      placeholder="Escaneie o código da posição"
                      value={scannerData.positionCode}
                      onChange={(e) => setScannerData(prev => ({ ...prev, positionCode: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="individualCustomPosition" className="text-sm">Posição</Label>
                    <div className="flex gap-2">
                      <Input
                        id="individualCustomPosition"
                        value={isEditingPosition ? customPosition : allocationResult.posicao_codigo}
                        onChange={(e) => setCustomPosition(e.target.value)}
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}