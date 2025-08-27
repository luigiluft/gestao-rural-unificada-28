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
import { usePalletsPendentes, useAllocatePallet, useCreateStockFromPallet } from "@/hooks/usePalletPositions";
import { useAvailablePositions } from "@/hooks/useStoragePositions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlocacaoPallets() {
  const [selectedDepositoId, setSelectedDepositoId] = useState<string>();
  const [selectedPallet, setSelectedPallet] = useState<string>();
  const [selectedPosition, setSelectedPosition] = useState<string>();
  const [observacoes, setObservacoes] = useState("");

  const { data: palletsPendentes, isLoading: loadingPallets } = usePalletsPendentes(selectedDepositoId);
  const { data: availablePositions } = useAvailablePositions(selectedDepositoId);
  const allocatePallet = useAllocatePallet();
  const createStock = useCreateStockFromPallet();

  const handleAllocate = async () => {
    if (!selectedPallet || !selectedPosition) return;

    try {
      await allocatePallet.mutateAsync({
        palletId: selectedPallet,
        posicaoId: selectedPosition,
        observacoes,
      });

      // Opcionalmente criar estoque imediatamente
      await createStock.mutateAsync(selectedPallet);

      // Reset form
      setSelectedPallet(undefined);
      setSelectedPosition(undefined);
      setObservacoes("");
    } catch (error) {
      console.error("Erro na alocação:", error);
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
                          onClick={() => setSelectedPallet(pallet.id)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Alocar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Alocar Pallet #{pallet.numero_pallet}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="position">Posição</Label>
                            <Select 
                              value={selectedPosition} 
                              onValueChange={setSelectedPosition}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma posição disponível" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePositions?.map((position) => (
                                  <SelectItem key={position.id} value={position.id}>
                                    {position.codigo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            onClick={handleAllocate}
                            disabled={!selectedPosition || allocatePallet.isPending}
                            className="w-full"
                          >
                            {allocatePallet.isPending ? "Alocando..." : "Confirmar Alocação"}
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
    </div>
  );
}