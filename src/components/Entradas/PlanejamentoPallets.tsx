import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Package, Edit3 } from "lucide-react"
import { PalletItemSelector } from "./PalletItemSelector"
import { 
  useEntradaPallets, 
  useCreatePallet, 
  useUpdatePallet, 
  useDeletePallet,
  useAddItemToPallet,
  useRemoveItemFromPallet,
  useUpdatePalletItem,
  type EntradaPallet 
} from "@/hooks/useEntradaPallets"

interface PlanejamentoPalletsProps {
  entradaId: string
  entradaItens: Array<{
    id: string
    nome_produto: string
    codigo_produto?: string
    quantidade: number
  }>
}

export const PlanejamentoPallets = ({ entradaId, entradaItens }: PlanejamentoPalletsProps) => {
  console.log('🎯 PlanejamentoPallets renderizando:', { entradaId, entradaItens: entradaItens?.length })
  const { data: pallets = [], isLoading } = useEntradaPallets(entradaId)
  console.log('📦 Pallets carregados:', { pallets: pallets?.length, isLoading })
  const createPallet = useCreatePallet()
  const updatePallet = useUpdatePallet()
  const deletePallet = useDeletePallet()
  const addItemToPallet = useAddItemToPallet()
  const removeItemFromPallet = useRemoveItemFromPallet()
  const updatePalletItem = useUpdatePalletItem()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPallet, setEditingPallet] = useState<EntradaPallet | null>(null)
  const [newPallet, setNewPallet] = useState({
    numero_pallet: pallets.length + 1,
    descricao: "",
    peso_total: undefined as number | undefined,
  })


  const handleCreatePallet = async () => {
    await createPallet.mutateAsync({
      entrada_id: entradaId,
      numero_pallet: newPallet.numero_pallet,
      descricao: newPallet.descricao || null,
      peso_total: newPallet.peso_total || null,
    })
    setIsCreateDialogOpen(false)
    setNewPallet({
      numero_pallet: pallets.length + 2,
      descricao: "",
      peso_total: undefined,
    })
  }

  const handleUpdatePallet = async () => {
    if (!editingPallet) return
    
    await updatePallet.mutateAsync({
      id: editingPallet.id,
      descricao: editingPallet.descricao,
      peso_total: editingPallet.peso_total,
    })
    setEditingPallet(null)
  }

  const handleAddItemToPallet = async (data: { pallet_id: string; entrada_item_id: string; quantidade: number }) => {
    await addItemToPallet.mutateAsync(data)
  }

  const getAvailableItems = () => {
    const usedItemIds = new Set()
    pallets.forEach(pallet => {
      pallet.entrada_pallet_itens?.forEach(item => {
        usedItemIds.add(item.entrada_item_id)
      })
    })
    
    return entradaItens.filter(item => !usedItemIds.has(item.id))
  }

  const getTotalQuantidadeAlocada = (itemId: string) => {
    let total = 0
    pallets.forEach(pallet => {
      pallet.entrada_pallet_itens?.forEach(item => {
        if (item.entrada_item_id === itemId) {
          total += item.quantidade
        }
      })
    })
    return total
  }

  if (isLoading) {
    return <div className="text-center p-4">Carregando planejamento de pallets...</div>
  }

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="text-xs text-muted-foreground">
        Debug: {new Date().toISOString()} | Pallets: {pallets.length} | Versão: v2.0
      </div>
      
      {/* Header com resumo */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planejamento de Pallets</h3>
          <p className="text-sm text-muted-foreground">
            {pallets.length} pallet{pallets.length !== 1 ? 's' : ''} planejado{pallets.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Pallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numero">Número do Pallet</Label>
                <Input
                  id="numero"
                  type="number"
                  value={newPallet.numero_pallet}
                  onChange={(e) => setNewPallet(prev => ({ ...prev, numero_pallet: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={newPallet.descricao}
                  onChange={(e) => setNewPallet(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do pallet..."
                />
              </div>
              <div>
                <Label htmlFor="peso">Peso Total (kg) - opcional</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.01"
                  value={newPallet.peso_total || ""}
                  onChange={(e) => setNewPallet(prev => ({ ...prev, peso_total: parseFloat(e.target.value) || undefined }))}
                />
              </div>
              <Button onClick={handleCreatePallet} className="w-full" disabled={createPallet.isPending}>
                {createPallet.isPending ? "Criando..." : "Criar Pallet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Pallets */}
      <div className="grid gap-4">
        {pallets.map((pallet) => (
          <Card key={pallet.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pallet #{pallet.numero_pallet}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPallet(pallet)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePallet.mutate(pallet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {pallet.descricao && (
                <p className="text-sm text-muted-foreground">{pallet.descricao}</p>
              )}
              {pallet.peso_total && (
                <Badge variant="outline">Peso: {pallet.peso_total} kg</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Produtos já alocados */}
                <div>
                  <h4 className="font-medium">Produtos neste pallet:</h4>
                  {pallet.entrada_pallet_itens?.length ? (
                    <div className="space-y-2 mt-2">
                      {pallet.entrada_pallet_itens.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                          <div>
                            <span className="font-medium">{item.entrada_itens?.nome_produto}</span>
                            {item.entrada_itens?.codigo_produto && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({item.entrada_itens.codigo_produto})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{item.quantidade} unidades</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromPallet.mutate(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">Nenhum produto alocado neste pallet</p>
                  )}
                </div>

                {/* Seção para adicionar produtos a este pallet específico */}
                <div className="border-t pt-4">
                  <h5 className="font-medium text-sm mb-3">Adicionar produtos a este pallet:</h5>
                  <PalletItemSelector 
                    palletId={pallet.id}
                    entradaItens={entradaItens}
                    onAddItem={handleAddItemToPallet}
                    isLoading={addItemToPallet.isPending}
                    usedItems={pallets.flatMap(p => p.entrada_pallet_itens?.map(i => i.entrada_item_id) || [])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Dialog para editar pallet */}
      <Dialog open={!!editingPallet} onOpenChange={() => setEditingPallet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pallet #{editingPallet?.numero_pallet}</DialogTitle>
          </DialogHeader>
          {editingPallet && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={editingPallet.descricao || ""}
                  onChange={(e) => setEditingPallet(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                  placeholder="Descrição do pallet..."
                />
              </div>
              <div>
                <Label htmlFor="edit-peso">Peso Total (kg)</Label>
                <Input
                  id="edit-peso"
                  type="number"
                  step="0.01"
                  value={editingPallet.peso_total || ""}
                  onChange={(e) => setEditingPallet(prev => prev ? { ...prev, peso_total: parseFloat(e.target.value) || undefined } : null)}
                />
              </div>
              <Button onClick={handleUpdatePallet} className="w-full" disabled={updatePallet.isPending}>
                {updatePallet.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}