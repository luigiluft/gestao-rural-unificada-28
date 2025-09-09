import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, MapPin, Calendar, User, Trash2, Eye, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePalletPositions, useRemovePalletAllocation, useReallocatePallet } from "@/hooks/usePalletPositions";
import { useAvailablePositions } from "@/hooks/useStoragePositions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciarPosicoes() {
  const [selectedDepositoId, setSelectedDepositoId] = useState<string>();
  const [reallocateDialog, setReallocateDialog] = useState<{
    open: boolean;
    pallet?: any;
  }>({ open: false });
  const [newPositionId, setNewPositionId] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  
  const { data: palletPositions, isLoading } = usePalletPositions(selectedDepositoId);
  
  // Extrair depositoId do primeiro pallet para usar no availablePositions
  const depositoId = palletPositions?.[0]?.entrada_pallets?.entradas?.deposito_id;
  const { data: availablePositions } = useAvailablePositions(depositoId);
  const removeAllocation = useRemovePalletAllocation();
  const reallocatePallet = useReallocatePallet();

  const handleRemoveAllocation = async (palletId: string) => {
    if (confirm("Tem certeza que deseja remover esta alocação?")) {
      await removeAllocation.mutateAsync(palletId);
    }
  };

  const handleOpenReallocateDialog = (pallet: any) => {
    setReallocateDialog({ open: true, pallet });
    setNewPositionId("");
    setObservacoes("");
  };

  const handleReallocate = async () => {
    if (!reallocateDialog.pallet || !newPositionId) return;
    
    await reallocatePallet.mutateAsync({
      palletId: reallocateDialog.pallet.pallet_id,
      newPositionId,
      observacoes: observacoes || undefined
    });
    
    setReallocateDialog({ open: false });
    setNewPositionId("");
    setObservacoes("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Posições</h1>
            <p className="text-muted-foreground">Visualize e gerencie pallets nas posições</p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Posições</h1>
          <p className="text-muted-foreground">Visualize e gerencie pallets nas posições</p>
        </div>
      </div>

      {!palletPositions?.length ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Nenhuma posição ocupada"
          description="Não há pallets alocados no momento."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {palletPositions.length} pallet(s) alocado(s)
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pallet</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>NFe</TableHead>
                  <TableHead>Alocado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {palletPositions.map((position) => (
                  <TableRow key={position.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">#{position.entrada_pallets?.numero_pallet}</div>
                          {position.entrada_pallets?.descricao && (
                            <div className="text-xs text-muted-foreground">
                              {position.entrada_pallets.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">
                          {position.storage_positions?.codigo}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {position.entrada_pallets?.entradas?.numero_nfe || "N/A"}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          {format(new Date(position.alocado_em), "dd/MM/yyyy", { locale: ptBR })}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(position.alocado_em), "HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary">Alocado</Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Posição</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Pallet:</span>
                                    <p>#{position.entrada_pallets?.numero_pallet}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Posição:</span>
                                    <p>{position.storage_positions?.codigo}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Alocado em:</span>
                                    <p>{format(new Date(position.alocado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">NFe:</span>
                                    <p>{position.entrada_pallets?.entradas?.numero_nfe || "N/A"}</p>
                                  </div>
                                </div>
                                
                                {position.observacoes && (
                                  <div>
                                    <span className="font-medium">Observações:</span>
                                    <p className="text-sm text-muted-foreground mt-1">{position.observacoes}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenuItem 
                            onClick={() => handleOpenReallocateDialog(position)}
                            disabled={reallocatePallet.isPending}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Realocar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleRemoveAllocation(position.pallet_id)}
                            disabled={removeAllocation.isPending}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialog de Realocação */}
      <Dialog open={reallocateDialog.open} onOpenChange={(open) => setReallocateDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realocar Pallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pallet atual</Label>
              <p className="text-sm text-muted-foreground">
                #{reallocateDialog.pallet?.entrada_pallets?.numero_pallet} - 
                Posição atual: {reallocateDialog.pallet?.storage_positions?.codigo}
              </p>
            </div>

            <div>
              <Label htmlFor="newPosition">Nova Posição</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Depósito: {depositoId} | Posições disponíveis: {availablePositions?.length || 0}
              </p>
              <Select value={newPositionId} onValueChange={setNewPositionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma posição disponível..." />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {!availablePositions || availablePositions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma posição disponível
                    </div>
                  ) : (
                    availablePositions
                      ?.filter(position => position.id !== reallocateDialog.pallet?.posicao_id)
                      ?.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.codigo} - {position.descricao || 'Sem descrição'}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Motivo da realocação..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setReallocateDialog({ open: false })}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleReallocate}
                disabled={!newPositionId || reallocatePallet.isPending}
              >
                Realocar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}