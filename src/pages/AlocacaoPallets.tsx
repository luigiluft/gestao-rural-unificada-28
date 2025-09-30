import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Calendar, User, Hash, Hand, Scan, CheckSquare, Square } from "lucide-react";
import { usePalletsPendentes } from "@/hooks/usePalletPositions";
import { AllocationDialog } from "@/components/Entradas/AllocationDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlocacaoPallets() {
  const [selectedPallets, setSelectedPallets] = useState<string[]>([]);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [allocationMethod, setAllocationMethod] = useState<"manual" | "scanner" | null>(null);
  
  const {
    data: palletsPendentes,
    isLoading: loadingPallets
  } = usePalletsPendentes();

  const getSelectedPalletsData = () => {
    const data = selectedPallets
      .map(id => palletsPendentes?.find(p => p.id === id))
      .filter(Boolean);
    
    console.log('Selected pallets data:', data.length, 'pallets');
    data.forEach((pallet, idx) => {
      console.log(`Pallet ${idx + 1}:`, {
        id: pallet.id,
        numero: pallet.numero_pallet,
        items: pallet.entrada_pallet_itens?.length || 0,
        has_entrada_info: !!pallet.entradas
      });
    });
    
    return data;
  };

  const handleManualAllocation = () => {
    if (selectedPallets.length === 0) return;
    setAllocationMethod("manual");
    setAllocationDialogOpen(true);
  };

  const handleScannerAllocation = () => {
    if (selectedPallets.length === 0) return;
    setAllocationMethod("scanner");
    setAllocationDialogOpen(true);
  };

  const handleSelectPallet = (palletId: string, checked: boolean) => {
    setSelectedPallets(prev => checked ? [...prev, palletId] : prev.filter(id => id !== palletId));
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedPallets(checked ? palletsPendentes?.map(p => p.id) || [] : []);
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
          {[1, 2, 3].map(i => (
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
          {/* Barra de ações */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">{selectedPallets.length}</span> de{" "}
                <span className="font-medium">{palletsPendentes.length}</span> pallet(s) selecionado(s)
              </div>
              
              {selectedPallets.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setSelectedPallets([])}>
                  Limpar Seleção
                </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button 
                size="sm" 
                variant="outline" 
                disabled={selectedPallets.length === 0} 
                onClick={handleManualAllocation} 
                className="flex-shrink-0"
              >
                <Hand className="h-4 w-4 mr-2" />
                Alocar Manualmente
              </Button>
              <Button 
                size="sm" 
                disabled={selectedPallets.length === 0} 
                onClick={handleScannerAllocation} 
                className="flex-shrink-0"
              >
                <Scan className="h-4 w-4 mr-2" />
                Alocar com Scanner
              </Button>
            </div>
          </div>

          {/* Tabela de Pallets */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedPallets.length === palletsPendentes.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Pallet</TableHead>
                <TableHead>NFe</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {palletsPendentes.map((pallet) => (
                <TableRow key={pallet.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPallets.includes(pallet.id)}
                      onCheckedChange={(checked) => handleSelectPallet(pallet.id, checked as boolean)}
                      aria-label={`Selecionar pallet ${pallet.numero_pallet}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">#{pallet.numero_pallet}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {pallet.entradas?.numero_nfe || 'S/N'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Produtor
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Data entrada
                    </div>
                  </TableCell>
                  <TableCell>
                    {pallet.peso_total ? `${pallet.peso_total} kg` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary">
                        {pallet.entrada_pallet_itens?.length || 0} item(ns)
                      </Badge>
                      {pallet.entrada_pallet_itens && pallet.entrada_pallet_itens.length > 0 && (
                        <div className="text-xs text-muted-foreground max-w-48">
                          {pallet.entrada_pallet_itens.slice(0, 2).map((item: any, index: number) => (
                            <div key={index} className="truncate">
                              • {item.entrada_itens?.nome_produto || 'Produto'} ({item.quantidade} {item.entrada_itens?.unidade_comercial || 'UN'})
                            </div>
                          ))}
                          {pallet.entrada_pallet_itens.length > 2 && (
                            <div className="text-muted-foreground/70">
                              +{pallet.entrada_pallet_itens.length - 2} mais...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                    Selecione pallets e use os botões de alocação acima
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AllocationDialog
        open={allocationDialogOpen}
        onOpenChange={setAllocationDialogOpen}
        selectedPallets={getSelectedPalletsData()}
        method={allocationMethod}
      />
    </div>
  );
}