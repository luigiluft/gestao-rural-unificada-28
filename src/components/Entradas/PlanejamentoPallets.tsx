import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Package, Edit3, AlertCircle, Copy } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { 
  useEntradaPallets, 
  useCreatePallet, 
  useUpdatePallet, 
  useDeletePallet,
  useAddItemToPallet,
  useRemoveItemFromPallet,
  useUpdatePalletItem,
  type EntradaPallet,
  type EntradaPalletItem
} from "@/hooks/useEntradaPallets"

type ExtendedEntradaPallet = EntradaPallet & { entrada_pallet_itens?: EntradaPalletItem[] }

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
  const typedPallets = pallets as ExtendedEntradaPallet[]
  const createPallet = useCreatePallet()
  const updatePallet = useUpdatePallet()
  const deletePallet = useDeletePallet()
  const addItemToPallet = useAddItemToPallet()
  const removeItemFromPallet = useRemoveItemFromPallet()
  const updatePalletItem = useUpdatePalletItem()

  const [editingPallet, setEditingPallet] = useState<ExtendedEntradaPallet | null>(null)
  const [newPallet, setNewPallet] = useState({
    descricao: "",
  })
  const [selectedProductToPallet, setSelectedProductToPallet] = useState<{ productId: string; palletId: string; quantidade: number } | null>(null)
  const [selectedProductsForNewPallet, setSelectedProductsForNewPallet] = useState<Array<{
    productId: string
    quantidade: number
    nome: string
    codigo?: string
    maxQuantidade: number
  }>>([])
  const [duplicatingPallet, setDuplicatingPallet] = useState<{ palletId: string; quantity: number } | null>(null)

  const getNextPalletNumber = () => {
    const existingNumbers = typedPallets.map(p => p.numero_pallet).sort((a, b) => a - b)
    for (let i = 1; i <= existingNumbers.length + 1; i++) {
      if (!existingNumbers.includes(i)) {
        return i
      }
    }
    return existingNumbers.length + 1
  }


  const handleCreatePallet = async () => {
    if (selectedProductsForNewPallet.length === 0) return

    const palletData = await createPallet.mutateAsync({
      entrada_id: entradaId,
      numero_pallet: getNextPalletNumber(),
      descricao: newPallet.descricao || null,
      peso_total: null,
    })

    // Adicionar todos os produtos selecionados ao pallet recém-criado
    for (const product of selectedProductsForNewPallet) {
      await addItemToPallet.mutateAsync({
        pallet_id: palletData.id,
        entrada_item_id: product.productId,
        quantidade: product.quantidade
      })
    }

    // Reset
    setNewPallet({ descricao: "" })
    setSelectedProductsForNewPallet([])
  }

  const handleUpdatePallet = async () => {
    if (!editingPallet) return
    
    await updatePallet.mutateAsync({
      id: editingPallet.id,
      descricao: editingPallet.descricao,
      peso_total: null,
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

  const handleAddProductToNewPallet = (productId: string, quantidade: number) => {
    const produto = entradaItens.find(p => p.id === productId)
    if (!produto) return

    const existingIndex = selectedProductsForNewPallet.findIndex(p => p.productId === productId)
    
    if (existingIndex >= 0) {
      // Atualizar quantidade existente
      setSelectedProductsForNewPallet(prev => 
        prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantidade }
            : item
        )
      )
    } else {
      // Adicionar novo produto
      setSelectedProductsForNewPallet(prev => [...prev, {
        productId,
        quantidade,
        nome: produto.nome_produto,
        codigo: produto.codigo_produto,
        maxQuantidade: getQuantidadeDisponivel(productId)
      }])
    }
  }

  const handleRemoveProductFromNewPallet = (productId: string) => {
    setSelectedProductsForNewPallet(prev => prev.filter(p => p.productId !== productId))
  }

  const getTotalQuantidadeAlocada = (itemId: string) => {
    let total = 0
    typedPallets.forEach(pallet => {
      pallet.entrada_pallet_itens?.forEach(item => {
        if (item.entrada_item_id === itemId) {
          total += Number(item.quantidade)
        }
      })
    })
    
    // Somar também os produtos selecionados para o novo pallet
    selectedProductsForNewPallet.forEach(product => {
      if (product.productId === itemId) {
        total += product.quantidade
      }
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

  const getAvailableProductsForNewPallet = () => {
    return entradaItens.filter(item => getQuantidadeDisponivel(item.id) > 0)
  }

  const handleDuplicatePallet = async (originalPallet: ExtendedEntradaPallet, quantity: number) => {
    if (quantity <= 1) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que 1.",
        variant: "destructive"
      })
      return
    }

    // Verificar se há produtos suficientes para duplicar
    const requiredProducts: { [key: string]: number } = {}
    originalPallet.entrada_pallet_itens?.forEach(item => {
      requiredProducts[item.entrada_item_id] = Number(item.quantidade) * (quantity - 1) // -1 porque o original já existe
    })

    // Verificar disponibilidade
    for (const [itemId, neededQuantity] of Object.entries(requiredProducts)) {
      const available = getQuantidadeDisponivel(itemId)
      if (available < neededQuantity) {
        const produto = entradaItens.find(i => i.id === itemId)
        const maxPallets = Math.floor(available / Number(originalPallet.entrada_pallet_itens?.find(i => i.entrada_item_id === itemId)?.quantidade || 0)) + 1
        toast({
          title: "Estoque insuficiente",
          description: `Não há ${produto?.nome_produto} suficiente. Máximo possível: ${maxPallets} pallets.`,
          variant: "destructive"
        })
        return
      }
    }

    try {
      // Criar os pallets duplicados
      for (let i = 1; i < quantity; i++) {
        const newPalletData = await createPallet.mutateAsync({
          entrada_id: entradaId,
          numero_pallet: getNextPalletNumber(),
          descricao: originalPallet.descricao ? `${originalPallet.descricao} (Cópia ${i})` : `Pallet ${originalPallet.numero_pallet} (Cópia ${i})`,
          peso_total: originalPallet.peso_total,
        })

        // Adicionar os mesmos produtos ao pallet duplicado
        if (originalPallet.entrada_pallet_itens) {
          for (const item of originalPallet.entrada_pallet_itens) {
            await addItemToPallet.mutateAsync({
              pallet_id: newPalletData.id,
              entrada_item_id: item.entrada_item_id,
              quantidade: Number(item.quantidade)
            })
          }
        }
      }

      toast({
        title: "Pallets duplicados",
        description: `${quantity - 1} pallet${quantity > 2 ? 's' : ''} criado${quantity > 2 ? 's' : ''} com sucesso!`,
      })

    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Erro ao criar pallets duplicados. Tente novamente.",
        variant: "destructive"
      })
    }
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
              {typedPallets.length} pallet{typedPallets.length !== 1 ? 's' : ''} planejado{typedPallets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Formulário Inline para Novo Pallet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Pallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de Produtos */}
            <div>
              <Label className="text-sm">Selecionar Produtos:</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {getAvailableProductsForNewPallet().map((produto) => {
                  const isSelected = selectedProductsForNewPallet.some(p => p.productId === produto.id)
                  const disponivel = getQuantidadeDisponivel(produto.id)
                  
                  return (
                    <Button
                      key={produto.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          handleRemoveProductFromNewPallet(produto.id)
                        } else {
                          handleAddProductToNewPallet(produto.id, disponivel)
                        }
                      }}
                      className="text-left justify-start h-auto py-2"
                    >
                      <div className="truncate">
                        <div className="text-xs font-medium">{produto.nome_produto}</div>
                        <div className="text-xs text-muted-foreground">
                          Disponível: {disponivel} {produto.codigo_produto ? `(${produto.codigo_produto})` : ''}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Produtos Selecionados */}
            {selectedProductsForNewPallet.length > 0 && (
              <div>
                <Label className="text-sm">Produtos Selecionados:</Label>
                <div className="space-y-2 mt-2">
                  {selectedProductsForNewPallet.map((product) => (
                    <div key={product.productId} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.nome}</div>
                        {product.codigo && (
                          <div className="text-xs text-muted-foreground">{product.codigo}</div>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={product.quantidade}
                        onChange={(e) => handleAddProductToNewPallet(product.productId, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-sm"
                        max={product.maxQuantidade}
                        min={1}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProductFromNewPallet(product.productId)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div>
              <Label htmlFor="descricao" className="text-sm">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={newPallet.descricao}
                onChange={(e) => setNewPallet(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do pallet..."
                className="h-8"
              />
            </div>

            <Button 
              onClick={handleCreatePallet} 
              disabled={createPallet.isPending || selectedProductsForNewPallet.length === 0}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createPallet.isPending ? "Criando..." : `Criar Pallet com ${selectedProductsForNewPallet.length} produto${selectedProductsForNewPallet.length !== 1 ? 's' : ''}`}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Pallets */}
        <div className="space-y-3">
          {typedPallets.map((pallet) => (
            <Card key={pallet.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Pallet #{pallet.numero_pallet}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="2"
                        max="99"
                        placeholder="Qtd"
                        className="w-16 h-7 text-xs"
                        value={duplicatingPallet?.palletId === pallet.id ? duplicatingPallet.quantity : ""}
                        onChange={(e) => setDuplicatingPallet({
                          palletId: pallet.id,
                          quantity: parseInt(e.target.value) || 2
                        })}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (duplicatingPallet?.palletId === pallet.id && duplicatingPallet.quantity > 1) {
                            handleDuplicatePallet(pallet, duplicatingPallet.quantity)
                            setDuplicatingPallet(null)
                          } else {
                            toast({
                              title: "Quantidade necessária",
                              description: "Insira uma quantidade maior que 1 para duplicar.",
                              variant: "destructive"
                            })
                          }
                        }}
                        disabled={!duplicatingPallet?.palletId || duplicatingPallet.palletId !== pallet.id || duplicatingPallet.quantity <= 1}
                        className="h-7 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
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

          {typedPallets.length === 0 && (
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
                  {typedPallets.map((pallet) => (
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