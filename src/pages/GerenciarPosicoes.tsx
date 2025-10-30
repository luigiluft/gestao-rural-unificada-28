import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WarehouseMapViewer } from "@/components/WMS/WarehouseMapViewer";
import { Package, MapPin, Calendar, User, Trash2, Eye, ArrowRightLeft, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePalletPositions, usePalletPositionsAvariados, useRemovePalletAllocation, useReallocatePallet } from "@/hooks/usePalletPositions";
import { useAvailablePositions } from "@/hooks/useStoragePositions";
import { usePalletDetails } from "@/hooks/usePalletDetails";
import { useTodasFranquias } from "@/hooks/useDepositosDisponiveis";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciarPosicoes() {
  // Estado para seleção de depósito (fallback para depósito padrão)
  const [selectedDepositoForMap, setSelectedDepositoForMap] = useState<string>(
    '75edbf21-1efa-4397-8d0c-dddca9d572aa'
  );
  const [reallocateDialog, setReallocateDialog] = useState<{
    open: boolean;
    pallet?: any;
  }>({ open: false });
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    pallet?: any;
  }>({ open: false });
  const [newPositionId, setNewPositionId] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  
  // Buscar todas as franquias disponíveis
  const { data: franquias, isLoading: isLoadingFranquias } = useTodasFranquias();
  
  // Usar o depósito selecionado para buscar dados
  const { data: palletPositions, isLoading } = usePalletPositions(selectedDepositoForMap);
  const { data: palletPositionsAvariados, isLoading: isLoadingAvariados } = usePalletPositionsAvariados(selectedDepositoForMap);
  const { data: availablePositions } = useAvailablePositions(selectedDepositoForMap);
  const { data: palletDetails } = usePalletDetails(detailsDialog.pallet?.pallet_id);
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

  const handleOpenDetailsDialog = (pallet: any) => {
    setDetailsDialog({ open: true, pallet });
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
  
  // Componente de tabela reutilizável
  const PalletTable = ({ positions, isAvariados = false }: { positions: any[], isAvariados?: boolean }) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pallet</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead>Produtos</TableHead>
            <TableHead>NFe</TableHead>
            <TableHead>Alocado em</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => {
            // Extrair produtos únicos do pallet baseado na estrutura real dos dados
            const produtos = position.entrada_pallets?.entrada_pallet_itens?.reduce((acc: string[], item: any) => {
              // Acessar o nome do produto corretamente baseado na estrutura retornada
              const nomeProduto = 
                item.entrada_itens?.produtos?.nome || 
                item.entrada_itens?.nome_produto;
              
              if (nomeProduto && !acc.includes(nomeProduto)) {
                acc.push(nomeProduto);
              }
              return acc;
            }, []) || [];

            return (
              <TableRow key={position.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        #{position.entrada_pallets?.numero_pallet}
                        {isAvariados && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
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
                  <div className="space-y-1">
                    {produtos.length > 0 ? (
                      produtos.slice(0, 2).map((produto, index) => (
                        <div key={index} className={`text-sm ${isAvariados ? 'text-destructive' : ''}`}>
                          {produto}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Nenhum produto</div>
                    )}
                    {produtos.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{produtos.length - 2} mais
                      </div>
                    )}
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
                  <Badge variant={isAvariados ? "destructive" : "secondary"}>
                    {isAvariados ? "Avariado" : "Alocado"}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDetailsDialog(position)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading || isLoadingAvariados || isLoadingFranquias) {
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

      {/* Seletor de Depósito */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
        <Label htmlFor="deposito-select" className="font-medium whitespace-nowrap">
          Depósito:
        </Label>
        <Select 
          value={selectedDepositoForMap} 
          onValueChange={setSelectedDepositoForMap}
        >
          <SelectTrigger id="deposito-select" className="w-[300px]">
            <SelectValue placeholder="Selecione um depósito" />
          </SelectTrigger>
          <SelectContent>
            {franquias?.map((franquia) => (
              <SelectItem key={franquia.id} value={franquia.id}>
                {franquia.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {palletPositions?.length || 0} pallet(s) em estoque
        </div>
      </div>

      <Tabs defaultValue="estoque" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estoque">Pallets em Estoque</TabsTrigger>
          <TabsTrigger value="avariados">Pallets Avariados</TabsTrigger>
          <TabsTrigger value="mapa">Mapa do Armazém</TabsTrigger>
        </TabsList>
        
        <TabsContent value="estoque" className="space-y-4">
          {!palletPositions?.length ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Nenhuma posição ocupada"
              description="Não há pallets em estoque no momento."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {palletPositions.length} pallet(s) em estoque
                </div>
              </div>
              <PalletTable positions={palletPositions} />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="avariados" className="space-y-4">
          {!palletPositionsAvariados?.length ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
              title="Nenhum pallet avariado"
              description="Não há pallets avariados alocados no momento."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {palletPositionsAvariados.length} pallet(s) avariado(s)
                </div>
              </div>
              <PalletTable positions={palletPositionsAvariados} isAvariados={true} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="mapa">
          <WarehouseMapViewer depositoId={selectedDepositoForMap} />
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ open })}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pallet:</span>
                <p>#{detailsDialog.pallet?.entrada_pallets?.numero_pallet}</p>
              </div>
              <div>
                <span className="font-medium">Posição:</span>
                <p>{detailsDialog.pallet?.storage_positions?.codigo}</p>
              </div>
              <div>
                <span className="font-medium">Alocado em:</span>
                <p>{detailsDialog.pallet?.alocado_em ? format(new Date(detailsDialog.pallet.alocado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">NFe:</span>
                <p>{detailsDialog.pallet?.entrada_pallets?.entradas?.numero_nfe || "N/A"}</p>
              </div>
            </div>

            {detailsDialog.pallet?.observacoes && (
              <div>
                <span className="font-medium">Observações:</span>
                <p className="text-sm text-muted-foreground mt-1">{detailsDialog.pallet.observacoes}</p>
              </div>
            )}

            {/* Produtos do Pallet */}
            <div>
              <h4 className="font-medium mb-3">Produtos no Pallet</h4>
              {palletDetails && palletDetails.length > 0 ? (
                <div className="space-y-3">
                  {palletDetails.map((item) => (
                    <div key={item.id} className={`border rounded-lg p-4 space-y-2 ${
                      item.is_avaria ? 'bg-destructive/10 border-destructive/20' : ''
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.entrada_itens.produtos?.nome || item.entrada_itens.nome_produto}</p>
                            {item.is_avaria && (
                              <Badge variant="destructive" className="text-xs">AVARIA</Badge>
                            )}
                          </div>
                          {item.entrada_itens.produtos?.codigo && (
                            <p className="text-xs text-muted-foreground">Código: {item.entrada_itens.produtos.codigo}</p>
                          )}
                        </div>
                        <Badge variant="outline">{item.quantidade} unidades</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Lote:</span>
                          <p className="text-muted-foreground">{item.entrada_itens.lote || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium">Validade:</span>
                          <p className="text-muted-foreground">
                            {item.entrada_itens.data_validade 
                              ? format(new Date(item.entrada_itens.data_validade), "dd/MM/yyyy", { locale: ptBR })
                              : "N/A"
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum produto encontrado neste pallet.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                Posições disponíveis: {availablePositions?.length || 0}
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