import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Package, Minus, Printer, AlertTriangle } from "lucide-react"
import { PalletBarcodeLabel } from './PalletBarcodeLabel'
import { toast } from "@/hooks/use-toast"
import { 
  useEntradaPallets, 
  useCreatePallet, 
  useDeletePallet,
  useAddItemToPallet,
  useRemoveItemFromPallet,
  type EntradaPallet,
  type EntradaPalletItem
} from "@/hooks/useEntradaPallets"
import { 
  useEntradaDivergencias, 
  calculateQuantityAdjustment,
  type EntradaDivergencia
} from "@/hooks/useEntradaDivergencias"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { usePesoBrutoMaximoPallet } from "@/hooks/useConfiguracoesSistema"

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
  const { data: divergencias = [], isLoading: isLoadingDivergencias } = useEntradaDivergencias(entradaId)
  const typedPallets = pallets as ExtendedEntradaPallet[]
  const pesoBrutoMaximo = usePesoBrutoMaximoPallet()

  // Mapear quais pallets devem receber o tag de Avaria baseado nos itens com is_avaria: true
  const avariaPalletIds = useMemo(() => {
    const result = new Set<string>()
    
    typedPallets.forEach((pallet) => {
      const hasAvariaItems = pallet.entrada_pallet_itens?.some(item => item.is_avaria === true)
      if (hasAvariaItems) {
        result.add(pallet.id)
      }
    })

    return result
  }, [typedPallets])

  // Fetch product packaging information
  const { data: productPackaging = {} } = useQuery({
    queryKey: ["product-packaging", entradaItens.map(i => i.produto_id).filter(Boolean)],
    queryFn: async () => {
      const produtoIds = entradaItens.map(i => i.produto_id).filter(Boolean)
      if (produtoIds.length === 0) return {}
      
      const { data, error } = await supabase
        .from("produtos")
        .select("id, containers_per_package, package_capacity")
        .in("id", produtoIds)
      
      if (error) throw error
      
      const packagingMap: Record<string, { containers_per_package: number; package_capacity: number; increment: number }> = {}
      data.forEach(produto => {
        const containers = produto.containers_per_package || 1
        const capacity = produto.package_capacity || 1
        packagingMap[produto.id] = {
          containers_per_package: containers,
          package_capacity: capacity,
          increment: containers * capacity
        }
      })
      
      return packagingMap
    },
    enabled: entradaItens.some(i => i.produto_id)
  })
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

  // Group pallets by content
  const getGroupedPallets = () => {
    const groups: { [key: string]: ExtendedEntradaPallet[] } = {}
    
    typedPallets.forEach(pallet => {
      // Create a key based on pallet content
      const items = pallet.entrada_pallet_itens?.map(item => 
        `${item.entrada_item_id}-${item.quantidade}`
      ).sort().join('|') || ''
      
      if (!groups[items]) {
        groups[items] = []
      }
      groups[items].push(pallet)
    })
    
    return Object.values(groups).map(group => ({
      template: group[0],
      count: group.length,
      pallets: group
    }))
  }

  const handleCreatePallet = async () => {
    if (selectedProductsForNewPallet.length === 0) return

    // Verificar se há produtos de avaria e produtos normais misturados
    const hasAvaria = selectedProductsForNewPallet.some(p => p.isAvaria)
    const hasNormal = selectedProductsForNewPallet.some(p => !p.isAvaria)
    
    if (hasAvaria && hasNormal) {
      toast({
        title: "Erro de planejamento",
        description: "Produtos avariados não podem ser misturados com produtos normais no mesmo pallet.",
        variant: "destructive"
      })
      return
    }

    // Determinar descrição automática baseada no conteúdo
    let autoDescricao = newPallet.descricao || null
    if (hasAvaria) {
      autoDescricao = `Pallet ${getNextPalletNumber()} - Avaria`
    }

    const palletData = await createPallet.mutateAsync({
      entrada_id: entradaId,
      numero_pallet: getNextPalletNumber(),
      descricao: autoDescricao,
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
        quantidade: product.quantidade,
        is_avaria: product.isAvaria || false
      })
    }

    // Reset
    setNewPallet({ descricao: "" })
    setSelectedProductsForNewPallet([])
    
    if (hasAvaria) {
      toast({
        title: "Pallet de avaria criado",
        description: "Pallet específico para produtos avariados foi criado com sucesso.",
        variant: "default"
      })
    }
  }

  const handleAddItemToPallet = async (productId: string, palletId: string, quantidade: number, isAvaria = false) => {
    await addItemToPallet.mutateAsync({
      pallet_id: palletId,
      entrada_item_id: productId,
      quantidade,
      is_avaria: isAvaria
    })
  }

  const handleAddProductToNewPallet = (productId: string, quantidade: number, isAvaria = false) => {
    // Handle damaged products with their special ID format
    const originalId = productId.includes('_avaria') ? productId.replace('_avaria', '') : productId
    const produto = entradaItens.find(p => p.id === originalId)
    if (!produto) return

    // Validate quantity increment for normal products
    let validatedQuantity = quantidade
    if (!isAvaria) {
      validatedQuantity = validateQuantityIncrement(originalId, quantidade)
      if (validatedQuantity === 0) {
        const increment = getPackagingIncrement(originalId)
        validatedQuantity = increment
      }
    }

    const existingIndex = selectedProductsForNewPallet.findIndex(p => p.productId === productId)
    
    if (existingIndex >= 0) {
      // Atualizar quantidade existente
      setSelectedProductsForNewPallet(prev => 
        prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantidade: validatedQuantity }
            : item
        )
      )
    } else {
      // Adicionar novo produto
      const maxQuantidade = isAvaria ? 
        getQuantidadeDisponivel(originalId, true) : 
        getQuantidadeDisponivel(originalId)
        
      setSelectedProductsForNewPallet(prev => [...prev, {
        productId,
        quantidade: validatedQuantity,
        nome: isAvaria ? `${produto.nome_produto} (Avaria)` : produto.nome_produto,
        codigo: produto.codigo_produto,
        maxQuantidade,
        isAvaria
      }])
    }
  }

  const handleRemoveProductFromNewPallet = (productId: string) => {
    setSelectedProductsForNewPallet(prev => prev.filter(p => p.productId !== productId))
  }

  const getTotalQuantidadeAlocada = (itemId: string) => {
    let total = 0
    
    // Count all items in existing pallets (each pallet counts individually)
    typedPallets.forEach(pallet => {
      pallet.entrada_pallet_itens?.forEach(item => {
        if (item.entrada_item_id === itemId) {
          total += Number(item.quantidade)
        }
      })
    })
    
    // Add products selected for new pallet (only non-avaria)
    selectedProductsForNewPallet.forEach(product => {
      if (product.productId === itemId && !product.isAvaria) {
        total += product.quantidade
      }
    })
    
    return total
  }

  const getTotalQuantidadeAlocadaAvaria = (itemId: string) => {
    let total = 0
    
    // Count only items in existing pallets that are explicitly marked as avaria (is_avaria = true)
    typedPallets.forEach(pallet => {
      pallet.entrada_pallet_itens?.forEach(item => {
        if (item.entrada_item_id === itemId && item.is_avaria === true) {
          total += Number(item.quantidade)
        }
      })
    })
    
    // Add avaria products selected for new pallet
    selectedProductsForNewPallet.forEach(product => {
      if (product.productId === itemId && product.isAvaria) {
        total += product.quantidade
      }
    })
    
    return total
  }

  const getQuantidadeDisponivel = (itemId: string, includeAvaria = false) => {
    const item = entradaItens.find(i => i.id === itemId)
    if (!item) return 0
    
    const alocada = getTotalQuantidadeAlocada(itemId)
    const { quantityAdjustment, hasAvaria, avariaQuantity } = calculateQuantityAdjustment(
      itemId, 
      item.lote, 
      divergencias
    )
    
    // Calculate available quantity considering divergencias
    let disponivel = Number(item.quantidade) - quantityAdjustment - alocada
    
    if (includeAvaria && hasAvaria) {
      // If including avaria, count how much avaria was already allocated
      const avariaAlocada = getTotalQuantidadeAlocadaAvaria(itemId)
      return Math.max(0, avariaQuantity - avariaAlocada)
    } else if (!includeAvaria && hasAvaria) {
      // If not including avaria, subtract avaria quantity from available
      disponivel -= avariaQuantity
    }
    
    return Math.max(0, disponivel)
  }

  const getStatusCor = (itemId: string) => {
    const item = entradaItens.find(i => i.id === itemId)
    if (!item) return "text-gray-600 bg-gray-50"
    
    const disponivel = getQuantidadeDisponivel(itemId)
    const { hasAvaria } = calculateQuantityAdjustment(itemId, item.lote, divergencias)
    const original = item.quantidade || 0
    
    if (hasAvaria) return "text-orange-600 bg-orange-50" // Avaria status
    if (disponivel === 0) return "text-red-600 bg-red-50"
    if (disponivel < original) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  const getAvailableProductsForNewPallet = () => {
    const products = []
    
    entradaItens.forEach(item => {
      const disponivel = getQuantidadeDisponivel(item.id)
      const { hasAvaria, avariaQuantity } = calculateQuantityAdjustment(item.id, item.lote, divergencias)
      
      // Add normal product if available (this includes quantity adjustments but not damage)
      if (disponivel > 0) {
        products.push({
          ...item,
          isAvaria: false,
          displayName: item.nome_produto,
          disponivel
        })
      }
      
      // Add damaged product separately ONLY if there's actual damage (avaria)
      // Check if it's a real avaria (produto_faltante with AVARIA in observacoes)
      const hasRealAvaria = divergencias.some(div => {
        const matchesProduct = !div.produto_id || div.produto_id === item.id
        const matchesLote = !div.lote || !item.lote || div.lote === item.lote
        const isAvariaType = div.tipo_divergencia === 'avaria' || (div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:'))
        return matchesProduct && matchesLote && isAvariaType
      })
      
      if (hasRealAvaria && avariaQuantity > 0) {
        const avariaDisponivel = getQuantidadeDisponivel(item.id, true)
        if (avariaDisponivel > 0) {
          products.push({
            ...item,
            id: `${item.id}_avaria`, // Use unique ID for damaged version
            originalId: item.id, // Keep reference to original
            isAvaria: true,
            displayName: `${item.nome_produto} (Avaria)`,
            disponivel: avariaDisponivel
          })
        }
      }
    })
    
    return products
  }

  const getPackagingIncrement = (itemId: string) => {
    const item = entradaItens.find(i => i.id === itemId)
    if (!item?.produto_id) return 1
    
    const packaging = productPackaging[item.produto_id]
    return packaging?.increment || 1
  }

  const validateQuantityIncrement = (itemId: string, quantity: number) => {
    const increment = getPackagingIncrement(itemId)
    return Math.floor(quantity / increment) * increment
  }

  const calculatePalletGrossWeight = (products: Array<{ productId: string; quantidade: number; isAvaria?: boolean }>) => {
    // Calculate total net weight and multiply by 1.2 for gross weight
    const totalNetWeight = products.reduce((total, product) => {
      const originalId = product.productId.includes('_avaria') ? product.productId.replace('_avaria', '') : product.productId
      const item = entradaItens.find(i => i.id === originalId)
      // Assume 1kg per unit if no weight data available
      const unitWeight = 1 // This could be enhanced with actual product weight data
      return total + (product.quantidade * unitWeight)
    }, 0)
    
    return totalNetWeight * 1.2 // Gross weight = net weight * 1.2
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const isAvaria = productId.includes('_avaria')
    let validatedQuantity = newQuantity

    if (!isAvaria) {
      // For normal products, apply packaging constraints
      const originalId = productId.includes('_avaria') ? productId.replace('_avaria', '') : productId
      const increment = getPackagingIncrement(originalId)
      validatedQuantity = Math.floor(newQuantity / increment) * increment
      
      if (validatedQuantity === 0) return
    } else {
      // For avaria products, just ensure minimum of 1
      validatedQuantity = Math.max(1, newQuantity)
    }

    // Test the new quantity for weight validation
    const updatedProducts = selectedProductsForNewPallet.map(p => 
      p.productId === productId ? { ...p, quantidade: validatedQuantity } : p
    )
    
    const grossWeight = calculatePalletGrossWeight(updatedProducts)
    if (grossWeight > pesoBrutoMaximo) {
      toast({
        title: "Peso bruto excedido",
        description: `O peso bruto do pallet (${grossWeight.toFixed(1)} kg) excederá o máximo permitido (${pesoBrutoMaximo} kg).`,
        variant: "destructive"
      })
      return
    }

    setSelectedProductsForNewPallet(updatedProducts)
  }

  // Helper functions for divergencias display
  const getDivergenciasForProduct = (itemId: string, lote?: string) => {
    return divergencias.filter(div => {
      const matchesProduct = !div.produto_id || div.produto_id === itemId
      const matchesLote = !div.lote || !lote || div.lote === lote
      return matchesProduct && matchesLote
    })
  }

  const hasProductAvaria = (itemId: string, lote?: string) => {
    const productDivergencias = getDivergenciasForProduct(itemId, lote)
    return productDivergencias.some(div => 
      div.tipo_divergencia === 'avaria' || (div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:'))
    )
  }

  const handleDuplicatePallet = async (templatePallet: ExtendedEntradaPallet) => {
    // Check if there are enough products to duplicate
    const requiredProducts: { [key: string]: number } = {}
    templatePallet.entrada_pallet_itens?.forEach(item => {
      requiredProducts[item.entrada_item_id] = Number(item.quantidade)
    })

    // Check availability
    for (const [itemId, neededQuantity] of Object.entries(requiredProducts)) {
      const available = getQuantidadeDisponivel(itemId)
      if (available < neededQuantity) {
        const produto = entradaItens.find(i => i.id === itemId)
        toast({
          title: "Estoque insuficiente",
          description: `Não há ${produto?.nome_produto} suficiente para criar mais um pallet.`,
          variant: "destructive"
        })
        return
      }
    }

    try {
      const totalQuantidadeTemplate = templatePallet.entrada_pallet_itens?.reduce((acc, item) => acc + item.quantidade, 0) || 0
      
      const newPalletData = await createPallet.mutateAsync({
        entrada_id: entradaId,
        numero_pallet: getNextPalletNumber(),
        descricao: templatePallet.descricao,
        peso_total: templatePallet.peso_total,
        quantidade_atual: totalQuantidadeTemplate,
      })

      // Add same products to duplicated pallet
      if (templatePallet.entrada_pallet_itens) {
        for (const item of templatePallet.entrada_pallet_itens) {
          await addItemToPallet.mutateAsync({
            pallet_id: newPalletData.id,
            entrada_item_id: item.entrada_item_id,
            quantidade: Number(item.quantidade),
            is_avaria: item.is_avaria || false
          })
        }
      }

      toast({
        title: "Pallet duplicado",
        description: "Pallet criado com sucesso!",
      })

    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Erro ao criar pallet. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleRemoveLastPallet = async (group: { template: ExtendedEntradaPallet; pallets: ExtendedEntradaPallet[] }) => {
    if (group.pallets.length <= 1) return
    
    const lastPallet = group.pallets[group.pallets.length - 1]
    await deletePallet.mutateAsync(lastPallet.id)
    
    toast({
      title: "Pallet removido",
      description: "Último pallet do grupo removido com sucesso!",
    })
  }

  const canAddMorePallets = (templatePallet: ExtendedEntradaPallet) => {
    if (!templatePallet.entrada_pallet_itens) return false
    
    return templatePallet.entrada_pallet_itens.every(item => {
      const available = getQuantidadeDisponivel(item.entrada_item_id)
      return available >= Number(item.quantidade)
    })
  }

  if (isLoading || isLoadingDivergencias) {
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
                <TableHead>Divergências</TableHead>
                <TableHead>Alocada</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradaItens.map((item) => {
                const alocada = getTotalQuantidadeAlocada(item.id)
                const disponivel = getQuantidadeDisponivel(item.id)
                const disponivelAvaria = getQuantidadeDisponivel(item.id, true)
                const statusCor = getStatusCor(item.id)
                const productDivergencias = getDivergenciasForProduct(item.id, item.lote)
                const hasAvaria = hasProductAvaria(item.id, item.lote)
                const { quantityAdjustment } = calculateQuantityAdjustment(item.id, item.lote, divergencias)
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-medium">{item.nome_produto}</span>
                          {item.codigo_produto && (
                            <div className="text-sm text-muted-foreground">
                              {item.codigo_produto}
                            </div>
                          )}
                          {item.lote && (
                            <div className="text-xs text-muted-foreground">
                              Lote: {item.lote}
                            </div>
                          )}
                        </div>
                        {hasAvaria && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.quantidade}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {productDivergencias.length > 0 ? (
                          productDivergencias.map((div, idx) => {
                            const isAvaria = div.tipo_divergencia === 'avaria' || (div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:'))
                            
                            if (isAvaria) {
                              // Extract avaria quantity from observacoes
                              const match = div.observacoes?.match(/AVARIA:\s*(\d+)/)
                              const avariaQty = match ? match[1] : Math.abs(div.diferenca || 0)
                              return (
                                <Badge 
                                  key={idx}
                                  variant="destructive"
                                  className="text-xs block w-fit"
                                >
                                  Avaria: {avariaQty}
                                </Badge>
                              )
                            } else {
                              return (
                                <Badge 
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs block w-fit"
                                >
                                  Qtd: {div.diferenca > 0 ? '+' : ''}{ div.diferenca }
                                </Badge>
                              )
                            }
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhuma</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{alocada}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Produto normal */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={disponivel === 0}
                          onClick={() => setSelectedProductToPallet({ 
                            productId: item.id, 
                            palletId: "", 
                            quantidade: Math.min(disponivel, 1)
                          })}
                          className={`font-medium ${disponivel > 0 ? 'hover:bg-primary/10' : ''}`}
                        >
                          {disponivel}
                        </Button>
                        
                        {/* Produto avariado (separado) - só mostrar se tiver avaria real */}
                        {(() => {
                          const hasRealAvaria = divergencias.some(div => {
                            const matchesProduct = !div.produto_id || div.produto_id === item.id
                            const matchesLote = !div.lote || !item.lote || div.lote === item.lote
                            const isAvariaType = div.tipo_divergencia === 'avaria' || (div.tipo_divergencia === 'produto_faltante' && div.observacoes?.includes('AVARIA:'))
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
                                  quantidade: Math.min(disponivelAvaria, 1)
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
                    <TableCell>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${statusCor}`}>
                        {hasAvaria ? 'Avaria' :
                         disponivel === 0 ? 'Completo' : 
                         disponivel < (item.quantidade - quantityAdjustment) ? 'Parcial' : 'Disponível'}
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
                {getAvailableProductsForNewPallet().map((produto: any) => {
                  const isSelected = selectedProductsForNewPallet.some(p => p.productId === produto.id)
                  const increment = getPackagingIncrement(produto.originalId || produto.id)
                  
                  return (
                    <Button
                      key={produto.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          handleRemoveProductFromNewPallet(produto.id)
                        } else {
                          const initialQuantity = Math.min(produto.disponivel, increment)
                          handleAddProductToNewPallet(produto.id, initialQuantity, produto.isAvaria)
                        }
                      }}
                      className={`text-left justify-start h-auto py-2 ${produto.isAvaria ? 'border-orange-200 text-orange-700' : ''}`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-medium">{produto.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          Disponível: {produto.disponivel} 
                          {produto.codigo_produto ? ` (${produto.codigo_produto})` : ''}
                          {!produto.isAvaria && increment > 1 ? ` | Incremento: ${increment}` : ''}
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
                         <div className="flex items-center gap-2">
                           <div className="text-sm font-medium truncate">{product.nome}</div>
                           {product.isAvaria && (
                             <Badge variant="destructive" className="text-xs">Avaria</Badge>
                           )}
                         </div>
                         {product.codigo && (
                           <div className="text-xs text-muted-foreground">{product.codigo}</div>
                         )}
                         <div className="text-xs text-muted-foreground">
                           Incremento: {getPackagingIncrement(product.productId.includes('_avaria') ? product.productId.replace('_avaria', '') : product.productId)} unidades
                         </div>
                       </div>
                        <Input
                          type="number"
                          value={product.quantidade}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            if (product.isAvaria) {
                              // For avaria products, no packaging constraints
                              const validatedValue = Math.max(1, value)
                              handleQuantityChange(product.productId, validatedValue)
                            } else {
                              // For normal products, apply packaging constraints
                              const originalId = product.productId.includes('_avaria') ? product.productId.replace('_avaria', '') : product.productId
                              const increment = getPackagingIncrement(originalId)
                              const validatedValue = Math.floor(value / increment) * increment || increment
                              handleQuantityChange(product.productId, validatedValue)
                            }
                          }}
                          className="w-20 h-8 text-sm"
                          max={product.maxQuantidade}
                          min={product.isAvaria ? 1 : getPackagingIncrement(product.productId.includes('_avaria') ? product.productId.replace('_avaria', '') : product.productId)}
                          step={product.isAvaria ? 1 : getPackagingIncrement(product.productId.includes('_avaria') ? product.productId.replace('_avaria', '') : product.productId)}
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

        {/* Lista de Pallets Agrupados */}
        <div className="space-y-3">
          {getGroupedPallets().map((group, groupIndex) => (
            <Card key={groupIndex}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Pallet #{group.template.numero_pallet}
                      {group.count > 1 && (
                        <Badge variant="secondary" className="ml-1">
                          {group.count}x
                        </Badge>
                      )}
                      {(() => {
                        // Marcar como Avaria somente se ao menos um pallet deste grupo foi alocado com unidades avariadas
                        const hasAvariaForGroup = group.pallets.some(p => avariaPalletIds.has(p.id))
                        return hasAvariaForGroup ? (
                          <Badge variant="destructive" className="ml-1">
                            Avaria
                          </Badge>
                        ) : null
                      })()}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicatePallet(group.template)}
                      disabled={!canAddMorePallets(group.template)}
                      className="h-7 w-7 p-0"
                      title="Adicionar mais um pallet igual"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    {group.count > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLastPallet(group)}
                        className="h-7 w-7 p-0"
                        title="Remover último pallet"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPalletLabels(prev => ({ 
                          ...prev, 
                          [group.template.id]: !prev[group.template.id] 
                        }))}
                        className="h-7 w-7 p-0"
                        title="Visualizar etiquetas"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Delete all pallets in group
                          group.pallets.forEach(pallet => deletePallet.mutate(pallet.id))
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Remover todos os pallets deste tipo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                {group.template.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{group.template.descricao}</p>
                )}
              </CardHeader>
              <CardContent>
                {group.template.entrada_pallet_itens && group.template.entrada_pallet_itens.length > 0 ? (
                  <div className="space-y-2">
                    {group.template.entrada_pallet_itens.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.entrada_itens?.nome_produto}</div>
                          {item.entrada_itens?.codigo_produto && (
                            <div className="text-xs text-muted-foreground">{item.entrada_itens.codigo_produto}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {item.quantidade} × {group.count} = {Number(item.quantidade) * group.count} unidades
                          </Badge>
                          {item.is_avaria && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Avaria
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Pallet vazio</p>
                  </div>
                )}
                
                {/* Etiquetas dos Pallets */}
                {showPalletLabels[group.template.id] && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Etiquetas dos Pallets
                    </h4>
                    <div className="grid gap-3">
                      {group.pallets.map((pallet) => (
                        <PalletBarcodeLabel
                          key={pallet.id}
                          pallet={{
                            ...pallet,
                            entrada_pallet_itens: pallet.entrada_pallet_itens?.map(item => ({
                              quantidade: item.quantidade,
                              entrada_itens: {
                                nome_produto: item.entrada_itens?.nome_produto || 'Produto',
                                lote: `P${pallet.numero_pallet}-${new Date().getFullYear()}`,
                                data_validade: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 dias no futuro
                              }
                            }))
                          }}
                          entradaData={{
                            data_entrada: new Date().toISOString(),
                            fornecedor: { nome: 'Fornecedor Exemplo' }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {typedPallets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum pallet criado ainda</p>
            <p className="text-sm">Use o formulário acima para criar o primeiro pallet</p>
          </div>
        )}
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
                          selectedProductToPallet.quantidade,
                          selectedProductToPallet.isAvaria || false
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
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    if (selectedProductToPallet.isAvaria) {
                      // For avaria products, no packaging constraints
                      setSelectedProductToPallet(prev => 
                        prev ? { ...prev, quantidade: Math.max(1, value) } : null
                      )
                    } else {
                      // For normal products, apply packaging constraints
                      const increment = getPackagingIncrement(selectedProductToPallet.productId)
                      const validatedValue = validateQuantityIncrement(selectedProductToPallet.productId, value)
                      setSelectedProductToPallet(prev => 
                        prev ? { ...prev, quantidade: validatedValue || increment } : null
                      )
                    }
                  }}
                  max={selectedProductToPallet.isAvaria ? 
                    getQuantidadeDisponivel(selectedProductToPallet.productId, true) : 
                    getQuantidadeDisponivel(selectedProductToPallet.productId)
                  }
                  min={selectedProductToPallet.isAvaria ? 1 : getPackagingIncrement(selectedProductToPallet.productId)}
                  step={selectedProductToPallet.isAvaria ? 1 : getPackagingIncrement(selectedProductToPallet.productId)}
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
    </div>
  )
}