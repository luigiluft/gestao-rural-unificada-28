import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, Calendar, User, Hash, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePalletsPendentes, useAutoAllocatePallet, useCreateStockFromPallet, type PalletAllocationResult } from "@/hooks/usePalletPositions";
import { useAvailablePositions } from "@/hooks/useStoragePositions";
import ConfirmacaoAlocacao from "@/components/Entradas/ConfirmacaoAlocacao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlocacaoPallets() {
  const [selectedDepositoId, setSelectedDepositoId] = useState<string>();
  const [selectedPallet, setSelectedPallet] = useState<any>();
  const [observacoes, setObservacoes] = useState("");
  const [pendingAllocation, setPendingAllocation] = useState<PalletAllocationResult | null>(null);

  const { data: palletsPendentes, isLoading: loadingPallets } = usePalletsPendentes(selectedDepositoId);
  const autoAllocatePallet = useAutoAllocatePallet();
  const createStock = useCreateStockFromPallet();

  const handleAutoAllocate = async (pallet: any) => {
    if (!pallet?.entradas?.deposito_id) return;

    try {
      const result = await autoAllocatePallet.mutateAsync({
        palletId: pallet.id,
        depositoId: pallet.entradas.deposito_id,
        observacoes,
      });

      // Create stock immediately after allocation (no confirmation needed for now)
      await createStock.mutateAsync(pallet.id);

      // Reset form
      setSelectedPallet(undefined);
      setObservacoes("");
    } catch (error) {
      console.error("Erro na alocação automática:", error);
    }
  };

  const handleConfirmationComplete = async () => {
    if (pendingAllocation) {
      try {
        await createStock.mutateAsync(pendingAllocation.pallet_id);
        setPendingAllocation(null);
      } catch (error) {
        console.error("Erro ao criar estoque:", error);
      }
    }
  };

  const handleConfirmationCancel = () => {
    setPendingAllocation(null);
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
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setSelectedPallet(pallet)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Alocar Automaticamente
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Alocar Pallet #{pallet.numero_pallet}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <QrCode className="h-5 w-5 text-primary" />
                              <span className="font-semibold">Posição Selecionada Automaticamente</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              O sistema irá selecionar automaticamente a primeira posição disponível em ordem alfabética para este pallet.
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="observacoes">Observações (opcional)</Label>
                            <Textarea
                              id="observacoes"
                              value={observacoes}
                              onChange={(e) => setObservacoes(e.target.value)}
                              placeholder="Observações sobre a alocação..."
                            />
                          </div>

                          <Button 
                            onClick={() => handleAutoAllocate(selectedPallet)}
                            disabled={autoAllocatePallet.isPending || createStock.isPending}
                            className="w-full"
                          >
                            {(autoAllocatePallet.isPending || createStock.isPending) ? "Alocando..." : "Confirmar Alocação Automática"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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

      {/* Confirmation Dialog */}
      {pendingAllocation && (
        <Dialog open={!!pendingAllocation} onOpenChange={() => setPendingAllocation(null)}>
          <DialogContent className="max-w-4xl">
            <ConfirmacaoAlocacao
              allocation={pendingAllocation}
              onConfirmed={handleConfirmationComplete}
              onCancel={handleConfirmationCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}