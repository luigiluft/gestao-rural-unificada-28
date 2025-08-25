import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Package, Edit3, AlertCircle } from "lucide-react"
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
  const { data: pallets = [], isLoading } = useEntradaPallets(entradaId)
  const createPallet = useCreatePallet()
  const updatePallet = useUpdatePallet()
  const deletePallet = useDeletePallet()
  const addItemToPallet = useAddItemToPallet()
  const removeItemFromPallet = useRemoveItemFromPallet()
  const updatePalletItem = useUpdatePalletItem()

  const [editingPallet, setEditingPallet] = useState<EntradaPallet | null>(null)
  const [newPallet, setNewPallet] = useState({
    numero_pallet: pallets.length + 1,
    descricao: "",
    peso_total: undefined as number | undefined,
  })
  const [selectedProductToPallet, setSelectedProductToPallet] = useState<{ productId: string; palletId: string; quantidade: number } | null>(null)


  const handleCreatePallet = async () => {
    await createPallet.mutateAsync({
      entrada_id: entradaId,
      numero_pallet: newPallet.numero_pallet,
      descricao: newPallet.descricao || null,
      peso_total: newPallet.peso_total || null,
    })
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

  const handleAddItemToPallet = async (productId: string, palletId: string, quantidade: number) => {
    await addItemToPallet.mutateAsync({
      pallet_id: palletId,
      entrada_item_id: productId,
      quantidade
    })
  }

  const getTotalQuantidadeAlocada = (itemId: string) => {
    let total = 0
    pallets.forEach(pallet => {
      pallet.entrada_pallet_itens?.forEach(item => {
        if (item.entrada_item_id === itemId) {
          total += Number(item.quantidade)
        }
      })
    })
    return total
  }

  const getQuantidadeDisponivel = (itemId: string) => {
    const item = entradaItens.find(i => i.id === itemId)
    if (!item) return 0
    const alocada = getTotalQuantidadeAlocada(itemId)
    return Number(item.quantidade) - alocada
  }

  const getStatusCor = (itemId: string) => {
    const disponivel = getQuantidadeDisponivel(itemId)
    const original = entradaItens.find(i => i.id === itemId)?.quantidade || 0
    
    if (disponivel === 0) return "text-red-600 bg-red-50"
    if (disponivel < original) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  if (isLoading) {
    return <div className="text-center p-4">Carregando planejamento de pallets...</div>
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Lado Esquerdo: Produtos Disponíveis */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Produtos da Entrada</h3>
          <p className="text-sm text-muted-foreground">
            Clique em uma quantidade para alocar a um pallet
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Alocada</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradaItens.map((item) => {
                const alocada = getTotalQuantidadeAlocada(item.id)
                const disponivel = getQuantidadeDisponivel(item.id)
                const statusCor = getStatusCor(item.id)
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.nome_produto}</span>
                        {item.codigo_produto && (
                          <div className="text-sm text-muted-foreground">
                            {item.codigo_produto}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.quantidade}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{alocada}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={disponivel === 0}
                        onClick={() => setSelectedProductToPallet({ 
                          productId: item.id, 
                          palletId: "", 
                          quantidade: disponivel 
                        })}
                        className={`font-medium ${disponivel > 0 ? 'hover:bg-primary/10' : ''}`}
                      >
                        {disponivel}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${statusCor}`}>
                        {disponivel === 0 ? 'Completo' : 
                         disponivel < item.quantidade ? 'Parcial' : 'Disponível'}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Lado Direito: Pallets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Pallets Criados</h3>
            <p className="text-sm text-muted-foreground">
              {pallets.length} pallet{pallets.length !== 1 ? 's' : ''} planejado{pallets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Formulário Inline para Novo Pallet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Pallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="numero" className="text-sm">Número</Label>
                <Input
                  id="numero"
                  type="number"
                  value={newPallet.numero_pallet}
                  onChange={(e) => setNewPallet(prev => ({ ...prev, numero_pallet: parseInt(e.target.value) || 1 }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="peso" className="text-sm">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.01"
                  value={newPallet.peso_total || ""}
                  onChange={(e) => setNewPallet(prev => ({ ...prev, peso_total: parseFloat(e.target.value) || undefined }))}
                  placeholder="Opcional"
                  className="h-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="descricao" className="text-sm">Descrição</Label>
              <Input
                id="descricao"
                value={newPallet.descricao}
                onChange={(e) => setNewPallet(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição opcional..."
                className="h-8"
              />
            </div>
            <Button 
              onClick={handleCreatePallet} 
              disabled={createPallet.isPending}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createPallet.isPending ? "Criando..." : "Novo Pallet"}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Pallets */}
        <div className="space-y-3">
          {pallets.map((pallet) => (
            <Card key={pallet.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Pallet #{pallet.numero_pallet}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPallet(pallet)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePallet.mutate(pallet.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {pallet.descricao && (
                  <p className="text-sm text-muted-foreground">{pallet.descricao}</p>
                )}
                {pallet.peso_total && (
                  <Badge variant="outline" className="w-fit">Peso: {pallet.peso_total} kg</Badge>
                )}
              </CardHeader>
              <CardContent>
                {/* Produtos já alocados */}
                {pallet.entrada_pallet_itens?.length ? (
                  <div className="space-y-2">
                    {pallet.entrada_pallet_itens.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{item.entrada_itens?.nome_produto}</span>
                          {item.entrada_itens?.codigo_produto && (
                            <span className="text-xs text-muted-foreground">
                              ({item.entrada_itens.codigo_produto})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{item.quantidade}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromPallet.mutate(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <AlertCircle className="h-4 w-4" />
                    Pallet vazio - clique em um produto disponível para alocar
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {pallets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum pallet criado ainda</p>
              <p className="text-sm">Use o formulário acima para criar o primeiro pallet</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog para seleção de produto para pallet */}
      {selectedProductToPallet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Alocar Produto</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Produto:</Label>
                <p className="text-sm text-muted-foreground">
                  {entradaItens.find(i => i.id === selectedProductToPallet.productId)?.nome_produto}
                </p>
              </div>
              
              <div>
                <Label>Selecionar Pallet:</Label>
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                  {pallets.map((pallet) => (
                    <Button
                      key={pallet.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={async () => {
                        await handleAddItemToPallet(
                          selectedProductToPallet.productId,
                          pallet.id,
                          selectedProductToPallet.quantidade
                        )
                        setSelectedProductToPallet(null)
                      }}
                    >
                      Pallet #{pallet.numero_pallet}
                      {pallet.descricao && (
                        <span className="text-muted-foreground ml-2">- {pallet.descricao}</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Quantidade:</Label>
                <Input
                  type="number"
                  value={selectedProductToPallet.quantidade}
                  onChange={(e) => setSelectedProductToPallet(prev => 
                    prev ? { ...prev, quantidade: parseInt(e.target.value) || 0 } : null
                  )}
                  max={getQuantidadeDisponivel(selectedProductToPallet.productId)}
                  min={1}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedProductToPallet(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Dialog para editar pallet */}
      {editingPallet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Editar Pallet #{editingPallet.numero_pallet}</h3>
            
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
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingPallet(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePallet} disabled={updatePallet.isPending}>
                {updatePallet.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}