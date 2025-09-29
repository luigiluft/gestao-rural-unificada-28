import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Package, Minus, Printer, AlertTriangle } from "lucide-react"
import { PalletBarcodeLabel } from './PalletBarcodeLabel'
import { toast } from "@/hooks/use-toast"
import { useEntradasPendentes } from "@/hooks/useEntradasPendentes"
import { useEntradaDivergencias } from "@/hooks/useEntradaDivergencias"
import { usePesoBrutoMaximoPallet } from "@/hooks/useConfiguracoesSistema"
import { 
  useEntradaPallets, 
  useCreatePallet, 
  useDeletePallet,
  useAddItemToPallet,
  useRemoveItemFromPallet,
  type EntradaPallet,
  type EntradaPalletItem
} from "@/hooks/useEntradaPallets"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

type ExtendedEntradaPallet = EntradaPallet & { 
  entrada_pallet_itens?: EntradaPalletItem[]
}

interface PlanejamentoPalletsProps {
  entradaId: string
  entradaItens: Array<{
    id: string
    nome_produto: string
    codigo_produto?: string
    quantidade: number
    lote?: string
    produto_id?: string
  }>
}

export const PlanejamentoPallets = ({ entradaId, entradaItens }: PlanejamentoPalletsProps) => {
  const { data: pallets = [], isLoading } = useEntradaPallets(entradaId)
  const { data: entradas } = useEntradasPendentes()
  const { data: divergencias = [] } = useEntradaDivergencias(entradaId)
  const pesoBrutoMaximo = usePesoBrutoMaximoPallet()
  const typedPallets = pallets as ExtendedEntradaPallet[]

  // Fetch product packaging information
  const { data: produtosData } = useQuery({
    queryKey: ["produtos-packaging", entradaItens.map(item => item.produto_id)],
    queryFn: async () => {
      const productIds = entradaItens.map(item => item.produto_id).filter(Boolean)
      if (productIds.length === 0) return []
      
      const { data, error } = await supabase
        .from("produtos")
        .select("id, containers_per_package, package_capacity")
        .in("id", productIds)
      
      if (error) throw error
      return data || []
    },
    enabled: entradaItens.length > 0
  })

  const getPackagingIncrement = (productId: string): number => {
    const produto = produtosData?.find(p => p.id === productId)
    const containers = produto?.containers_per_package || 1
    const capacity = produto?.package_capacity || 1
    return containers * capacity
  }

  const validateQuantityIncrement = (productId: string, quantity: number): boolean => {
    const increment = getPackagingIncrement(productId)
    return quantity > 0 && quantity % increment === 0
  }

  // Helper functions for weight calculation
  const getItemWeight = (productId: string, quantidade: number): number => {
    // Default 1kg if no weight info
    const pesoUnitario = 1 
    return quantidade * pesoUnitario
  }

  const getCurrentPalletWeight = (items: any[]): number => {
    return items.reduce((total, item) => {
      return total + getItemWeight(item.produto_id, item.quantidade)
    }, 0)
  }

  const createPallet = useCreatePallet()
  const deletePallet = useDeletePallet()
  const addItemToPallet = useAddItemToPallet()
  const removeItemFromPallet = useRemoveItemFromPallet()

  const [newPallet, setNewPallet] = useState({
    descricao: "",
  })
  const [selectedProductToPallet, setSelectedProductToPallet] = useState<{ productId: string; palletId: string; quantidade: number; isAvaria?: boolean } | null>(null)
  const [selectedProductsForNewPallet, setSelectedProductsForNewPallet] = useState<Array<{
    productId: string
    quantidade: number
    nome: string
    codigo?: string
    maxQuantidade: number
    isAvaria?: boolean
  }>>([])
  const [showPalletLabels, setShowPalletLabels] = useState<{ [key: string]: boolean }>({})

  const getNextPalletNumber = () => {
    const existingNumbers = typedPallets.map(p => p.numero_pallet).sort((a, b) => a - b)
    for (let i = 1; i <= existingNumbers.length + 1; i++) {
      if (!existingNumbers.includes(i)) {
        return i
      }
    }
    return existingNumbers.length + 1
  }

  // Calculate quantity adjustments and availability  
  const calculateQuantityAdjustment = (itemId: string, lote?: string, divergencias: any[] = []) => {
    const itemDivergencias = divergencias.filter(div => {
      const matchesProduct = !div.produto_id || div.produto_id === itemId
      const matchesLote = !div.lote || !lote || div.lote === lote
      return matchesProduct && matchesLote
    })

    let quantityAdjustment = 0
    let hasAvaria = false
    let avariaQuantity = 0

    itemDivergencias.forEach(div => {
      if (div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:')) {
        // Extract avaria quantity from observacoes
        const match = div.observacoes.match(/AVARIA:\s*(\d+)/)
        if (match) {
          avariaQuantity = parseInt(match[1])
          hasAvaria = true
        }
      } else if (div.tipo_divergencia === 'diferenca_quantidade') {
        quantityAdjustment += div.diferenca || 0
      }
    })

    return { quantityAdjustment, hasAvaria, avariaQuantity }
  }

  const getQuantidadeDisponivel = (itemId: string, isAvaria = false): number => {
    const item = entradaItens.find(i => i.id === itemId)
    if (!item) return 0

    const { quantityAdjustment, avariaQuantity } = calculateQuantityAdjustment(itemId, item.lote, divergencias)
    
    if (isAvaria) {
      return avariaQuantity
    }
    
    const baseQuantity = item.quantidade + quantityAdjustment
    return Math.max(0, baseQuantity)
  }

  // Get available products for new pallet (including damaged ones separately)
  const getAvailableProductsForNewPallet = () => {
    const products: any[] = []
    
    entradaItens.forEach(item => {
      const disponivel = getQuantidadeDisponivel(item.id)
      const { hasAvaria, avariaQuantity } = calculateQuantityAdjustment(item.id, item.lote, divergencias)
      
      // Add normal product if available (this includes quantity adjustments but not damage)
      if (disponivel > 0) {
        products.push({
          ...item,
          id: item.id,
          originalId: item.id,
          isAvaria: false,
          disponivel
        })
      }
      
      // Add damaged product separately ONLY if there's actual damage (avaria)
      // Check if it's a real avaria (produto_faltante with AVARIA in observacoes)
      const hasRealAvaria = divergencias.some(div => {
        const matchesProduct = !div.produto_id || div.produto_id === item.id
        const matchesLote = !div.lote || !item.lote || div.lote === item.lote
        const isAvariaType = div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:')
        return matchesProduct && matchesLote && isAvariaType
      })
      
      if (hasRealAvaria && avariaQuantity > 0) {
        products.push({
          ...item,
          id: `${item.id}_avaria`, // Use unique ID for damaged version
          originalId: item.id, // Keep reference to original
          isAvaria: true,
          displayName: `${item.nome_produto} (Avaria)`,
          disponivel: avariaQuantity
        })
      }
    })
    
    return products.filter(product => product.disponivel > 0)
  }

  const hasProductAvaria = (itemId: string, lote?: string) => {
    const productDivergencias = divergencias.filter(div => {
      const matchesProduct = !div.produto_id || div.produto_id === itemId
      const matchesLote = !div.lote || !lote || div.lote === lote
      return matchesProduct && matchesLote
    })
    return productDivergencias.some(div => 
      div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:')
    )
  }

  const handleAddProductToNewPallet = (productId: string, quantidade: number, isAvaria: boolean = false) => {
    const realProductId = isAvaria ? productId.replace('_avaria', '') : productId
    
    if (!validateQuantityIncrement(realProductId, quantidade)) {
      toast({
        title: "Quantidade inválida",
        description: `A quantidade deve ser um múltiplo de ${getPackagingIncrement(realProductId)}`,
        variant: "destructive"
      })
      return
    }

    // Validar peso bruto do pallet
    const currentPalletWeight = getCurrentPalletWeight(selectedProductsForNewPallet.map(p => ({ produto_id: p.productId, quantidade: p.quantidade })))
    const itemWeight = getItemWeight(realProductId, quantidade)
    const pesoBruto = (currentPalletWeight + itemWeight) * 1.2
    
    if (pesoBruto > pesoBrutoMaximo) {
      toast({
        title: "Peso excedido",
        description: `Este produto excederia o limite de peso bruto (${pesoBrutoMaximo}kg) do pallet. Peso bruto resultante: ${Math.round(pesoBruto)}kg`,
        variant: "destructive"
      })
      return
    }

    const entrada_item_id = realProductId
    const item = entradaItens.find(i => i.id === entrada_item_id)
    if (!item) return

    setSelectedProductsForNewPallet(prev => [
      ...prev,
      {
        productId: entrada_item_id,
        quantidade,
        nome: isAvaria ? `${item.nome_produto} (Avaria)` : item.nome_produto,
        codigo: item.codigo_produto,
        maxQuantidade: getQuantidadeDisponivel(entrada_item_id, isAvaria),
        isAvaria
      }
    ])
    setSelectedProductToPallet(null)
  }

  const handleEditPalletItem = (palletIndex: number, itemIndex: number, novaQuantidade: number) => {
    const item = selectedProductsForNewPallet[itemIndex]?.productId
    
    if (!validateQuantityIncrement(item, novaQuantidade)) {
      toast({
        title: "Quantidade inválida",
        description: `A quantidade deve ser um múltiplo de ${getPackagingIncrement(item)}`,
        variant: "destructive"
      })
      return
    }

    // Validar peso bruto do pallet (excluindo o item atual)
    const otherItems = selectedProductsForNewPallet.filter((_, idx) => idx !== itemIndex)
    const otherItemsWeight = getCurrentPalletWeight(otherItems.map(p => ({ produto_id: p.productId, quantidade: p.quantidade })))
    
    const newItemWeight = getItemWeight(item, novaQuantidade)
    const pesoBruto = (otherItemsWeight + newItemWeight) * 1.2
    
    if (pesoBruto > pesoBrutoMaximo) {
      toast({
        title: "Peso excedido",
        description: `Esta quantidade excederia o limite de peso bruto (${pesoBrutoMaximo}kg) do pallet. Peso bruto resultante: ${Math.round(pesoBruto)}kg`,
        variant: "destructive"
      })
      return
    }

    setSelectedProductsForNewPallet(prev => 
      prev.map((product, index) => 
        index === itemIndex 
          ? { ...product, quantidade: novaQuantidade }
          : product
      )
    )
  }

  const handleCreatePallet = async () => {
    if (selectedProductsForNewPallet.length === 0) return

    const palletData = await createPallet.mutateAsync({
      entrada_id: entradaId,
      numero_pallet: getNextPalletNumber(),
      descricao: newPallet.descricao || null,
      peso_total: null,
      quantidade_atual: selectedProductsForNewPallet.reduce((acc, product) => acc + product.quantidade, 0),
    })

    // Adicionar todos os produtos selecionados ao pallet recém-criado
    for (const product of selectedProductsForNewPallet) {
      const originalId = product.productId.includes('_avaria') ? 
        product.productId.replace('_avaria', '') : 
        product.productId
        
      await addItemToPallet.mutateAsync({
        pallet_id: palletData.id,
        entrada_item_id: originalId,
        quantidade: product.quantidade
      })
    }

    // Reset form
    setSelectedProductsForNewPallet([])
    setNewPallet({ descricao: "" })
    
    toast({
      title: "Pallet criado",
      description: `Pallet ${palletData.numero_pallet} criado com ${selectedProductsForNewPallet.length} produto(s).`,
    })
  }

  if (isLoading) {
    return <div className="p-6">Carregando pallets...</div>
  }

  const availableProducts = getAvailableProductsForNewPallet()

  return (
    <div className="space-y-6">
      {/* Lista de produtos da entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos da Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Clique em uma quantidade para alocar a um pallet
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Divergências</TableHead>
                <TableHead>Alocada</TableHead>
                <TableHead>Disponível</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradaItens.map((item) => {
                const disponivel = getQuantidadeDisponivel(item.id)
                const { hasAvaria, avariaQuantity } = calculateQuantityAdjustment(item.id, item.lote, divergencias)
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.nome_produto}</div>
                        {item.codigo_produto && (
                          <div className="text-sm text-muted-foreground">
                            {item.codigo_produto}
                          </div>
                        )}
                        {item.lote && (
                          <Badge variant="outline" className="mt-1">
                            Lote: {item.lote}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantidade}
                    </TableCell>
                    <TableCell className="text-center">
                      {divergencias.filter(div => {
                        const matchesProduct = !div.produto_id || div.produto_id === item.id
                        const matchesLote = !div.lote || !item.lote || div.lote === item.lote
                        return matchesProduct && matchesLote
                      }).map(div => {
                        if (div.tipo_divergencia === 'diferenca_quantidade') {
                          return (
                            <Badge key={div.id} variant="secondary" className="mr-1">
                              Qtd: {div.diferenca > 0 ? '+' : ''}{div.diferenca}
                            </Badge>
                          )
                        } else if (div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:')) {
                          const match = div.observacoes.match(/AVARIA:\s*(\d+)/)
                          const qty = match ? match[1] : '?'
                          return (
                            <Badge key={div.id} variant="destructive" className="mr-1">
                              Avaria: {qty}
                            </Badge>
                          )
                        }
                        return null
                      })}
                      {divergencias.filter(div => {
                        const matchesProduct = !div.produto_id || div.produto_id === item.id
                        const matchesLote = !div.lote || !item.lote || div.lote === item.lote
                        return matchesProduct && matchesLote
                      }).length === 0 && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">0</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={disponivel <= 0}
                          onClick={() => setSelectedProductToPallet({ 
                            productId: item.id, 
                            palletId: "", 
                            quantidade: Math.min(disponivel, getPackagingIncrement(item.produto_id))
                          })}
                          className="font-medium"
                        >
                          {disponivel}
                        </Button>
                        
                        {/* Produto avariado (separado) - só mostrar se tiver avaria real */}
                        {(() => {
                          const hasRealAvaria = divergencias.some(div => {
                            const matchesProduct = !div.produto_id || div.produto_id === item.id
                            const matchesLote = !div.lote || !item.lote || div.lote === item.lote
                            const isAvariaType = div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:')
                            return matchesProduct && matchesLote && isAvariaType
                          })
                          const disponivelAvaria = getQuantidadeDisponivel(item.id, true)
                          
                          if (hasRealAvaria && disponivelAvaria > 0) {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedProductToPallet({ 
                                  productId: item.id, 
                                  palletId: "", 
                                  quantidade: Math.min(disponivelAvaria, getPackagingIncrement(item.produto_id)),
                                  isAvaria: true
                                })}
                                className="font-medium text-orange-600 hover:bg-orange-50"
                                title="Produto avariado - será alocado em pallet separado"
                              >
                                {disponivelAvaria} (Avaria)
                              </Button>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para adicionar produto ao pallet */}
      {selectedProductToPallet && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              {selectedProductToPallet.isAvaria ? 'Adicionar Produto Avariado' : 'Adicionar Produto'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const item = entradaItens.find(i => i.id === selectedProductToPallet.productId)
              if (!item) return null

              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{item.nome_produto}</h4>
                    {selectedProductToPallet.isAvaria && (
                      <Badge variant="destructive" className="mt-1">Produto Avariado</Badge>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={selectedProductToPallet.quantidade}
                      onChange={(e) => setSelectedProductToPallet(prev => prev ? {
                        ...prev, 
                        quantidade: parseInt(e.target.value) || 0
                      } : null)}
                      min={getPackagingIncrement(selectedProductToPallet.isAvaria ? item.id.replace('_avaria', '') : item.produto_id)}
                      step={getPackagingIncrement(selectedProductToPallet.isAvaria ? item.id.replace('_avaria', '') : item.produto_id)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Incremento: {getPackagingIncrement(selectedProductToPallet.isAvaria ? item.id.replace('_avaria', '') : item.produto_id)} unidades
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAddProductToNewPallet(selectedProductToPallet.productId, selectedProductToPallet.quantidade, selectedProductToPallet.isAvaria)}
                      disabled={selectedProductToPallet.quantidade <= 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedProductToPallet(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Novo Pallet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Pallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="selecionar-produtos">Selecionar Produtos:</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {availableProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    size="sm"
                    className={`w-full justify-start text-left ${product.isAvaria ? 'border-orange-200 bg-orange-50' : ''}`}
                    onClick={() => setSelectedProductToPallet({
                      productId: product.id,
                      palletId: "",
                      quantidade: Math.min(product.disponivel, getPackagingIncrement(product.produto_id)),
                      isAvaria: product.isAvaria
                    })}
                  >
                    <div className="text-xs">
                      <div className="font-medium">{product.nome_produto}</div>
                      {product.isAvaria && <div className="text-orange-600">(Avaria)</div>}
                      <div className="text-muted-foreground">
                        Disponível: {product.disponivel} | 
                        Incremento: {getPackagingIncrement(product.produto_id)}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={newPallet.descricao}
                onChange={(e) => setNewPallet(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do pallet..."
              />
            </div>
          </div>

          {selectedProductsForNewPallet.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Produtos Selecionados:</h4>
              <div className="space-y-2">
                {selectedProductsForNewPallet.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">{product.nome}</span>
                      {product.codigo && (
                        <span className="text-sm text-muted-foreground ml-2">({product.codigo})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={product.quantidade}
                        onChange={(e) => handleEditPalletItem(-1, index, parseInt(e.target.value) || 0)}
                        className="w-20"
                        min={getPackagingIncrement(product.productId)}
                        step={getPackagingIncrement(product.productId)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProductsForNewPallet(prev => 
                          prev.filter((_, i) => i !== index)
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleCreatePallet}
                className="w-full mt-4"
                disabled={createPallet.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createPallet.isPending ? "Criando..." : `Criar Pallet com ${selectedProductsForNewPallet.length} produto(s)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pallets Criados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pallets Criados
            <Badge variant="secondary">{typedPallets.length} pallets planejados</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typedPallets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pallet criado ainda
            </div>
          ) : (
            <div className="space-y-4">
              {typedPallets.map((pallet) => (
                <div key={pallet.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Pallet #{pallet.numero_pallet}</h4>
                      {pallet.descricao && (
                        <p className="text-sm text-muted-foreground">{pallet.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPalletLabels(prev => ({
                          ...prev,
                          [pallet.id]: !prev[pallet.id]
                        }))}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        {showPalletLabels[pallet.id] ? 'Ocultar' : 'Mostrar'} Etiqueta
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePallet.mutateAsync(pallet.id)}
                        disabled={deletePallet.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Items do pallet */}
                  {pallet.entrada_pallet_itens && pallet.entrada_pallet_itens.length > 0 && (
                    <div className="space-y-1">
                      {pallet.entrada_pallet_itens.map((item, idx) => {
                        const entradaItem = entradaItens.find(ei => ei.id === item.entrada_item_id)
                        return (
                          <div key={idx} className="text-sm flex justify-between">
                            <span>{entradaItem?.nome_produto || 'Produto não encontrado'}</span>
                            <span>{item.quantidade} unidades</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Etiqueta do pallet */}
                  {showPalletLabels[pallet.id] && (
                    <div className="mt-4 border-t pt-4">
                      <PalletBarcodeLabel 
                        pallet={{
                          id: pallet.id,
                          numero_pallet: pallet.numero_pallet,
                          codigo_barras: pallet.codigo_barras,
                          quantidade_atual: pallet.quantidade_atual || 0,
                          entrada_pallet_itens: pallet.entrada_pallet_itens?.map(item => ({
                            quantidade: item.quantidade,
                            entrada_itens: {
                              nome_produto: entradaItens.find(ei => ei.id === item.entrada_item_id)?.nome_produto || 'Produto não encontrado',
                              lote: entradaItens.find(ei => ei.id === item.entrada_item_id)?.lote,
                              data_validade: undefined
                            }
                          }))
                        }}
                        
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}