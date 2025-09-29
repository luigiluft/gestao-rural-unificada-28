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
      return total + getItemWeight(item.produto_id || item.productId, item.quantidade)
    }, 0)
  }

  const createPallet = useCreatePallet()
  const deletePallet = useDeletePallet()
  const addItemToPallet = useAddItemToPallet()
  const removeItemFromPallet = useRemoveItemFromPallet()

  const [newPalletItems, setNewPalletItems] = useState<Array<{
    productId: string
    quantidade: number
    nome: string
    codigo?: string
    maxQuantidade: number
    isAvaria?: boolean
  }>>([])
  const [newPalletDescription, setNewPalletDescription] = useState("")
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

  const handleAddProductToNewPallet = (productId: string, isAvaria: boolean = false) => {
    const realProductId = isAvaria ? productId.replace('_avaria', '') : productId
    const increment = getPackagingIncrement(realProductId)
    
    // Validar peso bruto do pallet
    const currentPalletWeight = getCurrentPalletWeight(newPalletItems)
    const itemWeight = getItemWeight(realProductId, increment)
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

    setNewPalletItems(prev => [
      ...prev,
      {
        productId: entrada_item_id,
        quantidade: increment,
        nome: isAvaria ? `${item.nome_produto} (Avaria)` : item.nome_produto,
        codigo: item.codigo_produto,
        maxQuantidade: getQuantidadeDisponivel(entrada_item_id, isAvaria),
        isAvaria
      }
    ])
  }

  const handleEditPalletItemQuantity = (itemIndex: number, novaQuantidade: number) => {
    const item = newPalletItems[itemIndex]
    
    if (!validateQuantityIncrement(item.productId, novaQuantidade)) {
      toast({
        title: "Quantidade inválida",
        description: `A quantidade deve ser um múltiplo de ${getPackagingIncrement(item.productId)}`,
        variant: "destructive"
      })
      return
    }

    // Validar peso bruto do pallet (excluindo o item atual)
    const otherItems = newPalletItems.filter((_, idx) => idx !== itemIndex)
    const otherItemsWeight = getCurrentPalletWeight(otherItems)
    
    const newItemWeight = getItemWeight(item.productId, novaQuantidade)
    const pesoBruto = (otherItemsWeight + newItemWeight) * 1.2
    
    if (pesoBruto > pesoBrutoMaximo) {
      toast({
        title: "Peso excedido",
        description: `Esta quantidade excederia o limite de peso bruto (${pesoBrutoMaximo}kg) do pallet. Peso bruto resultante: ${Math.round(pesoBruto)}kg`,
        variant: "destructive"
      })
      return
    }

    setNewPalletItems(prev => 
      prev.map((product, index) => 
        index === itemIndex 
          ? { ...product, quantidade: novaQuantidade }
          : product
      )
    )
  }

  const handleCreatePallet = async () => {
    if (newPalletItems.length === 0) return

    const palletData = await createPallet.mutateAsync({
      entrada_id: entradaId,
      numero_pallet: getNextPalletNumber(),
      descricao: newPalletDescription || null,
      peso_total: null,
      quantidade_atual: newPalletItems.reduce((acc, product) => acc + product.quantidade, 0),
    })

    // Adicionar todos os produtos selecionados ao pallet recém-criado
    for (const product of newPalletItems) {
      await addItemToPallet.mutateAsync({
        pallet_id: palletData.id,
        entrada_item_id: product.productId,
        quantidade: product.quantidade
      })
    }

    // Reset form
    setNewPalletItems([])
    setNewPalletDescription("")
    
    toast({
      title: "Pallet criado",
      description: `Pallet ${palletData.numero_pallet} criado com ${newPalletItems.length} produto(s).`,
    })
  }

  if (isLoading) {
    return <div className="p-6">Carregando pallets...</div>
  }

  const availableProducts = getAvailableProductsForNewPallet()

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left side - Produtos da Entrada */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos da Entrada
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Clique em uma quantidade para alocar a um pallet
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Original</TableHead>
                  <TableHead className="text-center">Divergências</TableHead>
                  <TableHead className="text-center">Alocada</TableHead>
                  <TableHead className="text-center">Disponível</TableHead>
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
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1">
                          {disponivel > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddProductToNewPallet(item.id, false)}
                              className="font-medium h-6 px-2 text-xs"
                            >
                              {disponivel}
                            </Button>
                          )}
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
                                  onClick={() => handleAddProductToNewPallet(item.id, true)}
                                  className="font-medium text-orange-600 hover:bg-orange-50 h-6 px-2 text-xs"
                                  title="Produto avariado - será alocado em pallet separado"
                                >
                                  {disponivelAvaria}
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
      </div>

      {/* Right side - Pallets Criados & Novo Pallet */}
      <div className="space-y-4">
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
              <div className="text-center py-4 text-muted-foreground">
                0 pallets planejados
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {typedPallets.map((pallet) => (
                  <div key={pallet.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">Pallet #{pallet.numero_pallet}</span>
                      {pallet.descricao && (
                        <p className="text-xs text-muted-foreground">{pallet.descricao}</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePallet.mutateAsync(pallet.id)}
                      disabled={deletePallet.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Novo Pallet */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Pallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Selecionar Produtos:</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className={`w-full justify-start text-left h-auto py-2 ${product.isAvaria ? 'border-orange-200 bg-orange-50' : 'bg-green-500 hover:bg-green-600 text-white border-green-500'}`}
                    onClick={() => handleAddProductToNewPallet(product.id, product.isAvaria)}
                  >
                    <div className="text-sm">
                      <div className="font-medium">{product.nome_produto}</div>
                      {product.isAvaria && <div className="text-orange-600">(Avaria)</div>}
                      <div className={`text-xs ${product.isAvaria ? 'text-muted-foreground' : 'text-green-100'}`}>
                        Disponível: {product.disponivel} (incremento {getPackagingIncrement(product.produto_id)})
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Produtos Selecionados:</Label>
              {newPalletItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum produto selecionado
                </div>
              ) : (
                <div className="space-y-2">
                  {newPalletItems.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.nome}</div>
                        {product.codigo && (
                          <div className="text-xs text-muted-foreground">{product.codigo}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentQty = product.quantidade
                              const increment = getPackagingIncrement(product.productId)
                              const newQty = Math.max(increment, currentQty - increment)
                              handleEditPalletItemQuantity(index, newQty)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{product.quantidade}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentQty = product.quantidade
                              const increment = getPackagingIncrement(product.productId)
                              const newQty = currentQty + increment
                              if (newQty <= product.maxQuantidade) {
                                handleEditPalletItemQuantity(index, newQty)
                              }
                            }}
                            className="h-6 w-6 p-0"
                            disabled={product.quantidade + getPackagingIncrement(product.productId) > product.maxQuantidade}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewPalletItems(prev => prev.filter((_, i) => i !== index))}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={newPalletDescription}
                onChange={(e) => setNewPalletDescription(e.target.value)}
                placeholder="Descrição do pallet..."
              />
            </div>

            <Button 
              onClick={handleCreatePallet}
              className="w-full"
              disabled={createPallet.isPending || newPalletItems.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createPallet.isPending 
                ? "Criando..." 
                : `Criar Pallet com ${newPalletItems.length} produto${newPalletItems.length !== 1 ? 's' : ''}`
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}