import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface PalletItemSelectorProps {
  palletId: string
  entradaItens: Array<{
    id: string
    nome_produto: string
    codigo_produto?: string
    quantidade: number
  }>
  onAddItem: (data: { pallet_id: string; entrada_item_id: string; quantidade: number }) => Promise<void>
  isLoading: boolean
  usedItems: string[]
}

interface SelectedItem {
  itemId: string
  quantidade: number
  maxQuantidade: number
  nome: string
  codigo?: string
}

export const PalletItemSelector = ({ 
  palletId, 
  entradaItens, 
  onAddItem, 
  isLoading, 
  usedItems 
}: PalletItemSelectorProps) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [currentItemId, setCurrentItemId] = useState("")
  const [currentQuantidade, setCurrentQuantidade] = useState("")

  // Filtrar itens disponíveis (não usados em outros pallets)
  const availableItems = entradaItens.filter(item => !usedItems.includes(item.id))

  const handleAddToSelection = () => {
    if (!currentItemId || !currentQuantidade) return

    const item = entradaItens.find(i => i.id === currentItemId)
    if (!item) return

    const quantidade = parseFloat(currentQuantidade)
    if (quantidade <= 0 || quantidade > item.quantidade) return

    // Verificar se o item já foi selecionado
    if (selectedItems.some(si => si.itemId === currentItemId)) return

    setSelectedItems(prev => [...prev, {
      itemId: currentItemId,
      quantidade,
      maxQuantidade: item.quantidade,
      nome: item.nome_produto,
      codigo: item.codigo_produto
    }])

    setCurrentItemId("")
    setCurrentQuantidade("")
  }

  const handleRemoveFromSelection = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.itemId !== itemId))
  }

  const handleUpdateQuantidade = (itemId: string, novaQuantidade: string) => {
    const quantidade = parseFloat(novaQuantidade)
    if (isNaN(quantidade) || quantidade <= 0) return

    setSelectedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantidade: Math.min(quantidade, item.maxQuantidade) }
        : item
    ))
  }

  const handleConfirmSelection = async () => {
    for (const item of selectedItems) {
      await onAddItem({
        pallet_id: palletId,
        entrada_item_id: item.itemId,
        quantidade: item.quantidade
      })
    }
    setSelectedItems([])
  }

  const getFilteredAvailableItems = () => {
    return availableItems.filter(item => 
      !selectedItems.some(si => si.itemId === item.id)
    )
  }

  return (
    <div className="space-y-4">
      {/* Adicionar novo item à seleção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Produto</Label>
          <Select value={currentItemId} onValueChange={setCurrentItemId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Selecionar produto" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredAvailableItems().map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nome_produto} 
                  {item.codigo_produto && ` (${item.codigo_produto})`}
                  <Badge variant="outline" className="ml-2">{item.quantidade}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Quantidade</Label>
          <Input
            type="number"
            value={currentQuantidade}
            onChange={(e) => setCurrentQuantidade(e.target.value)}
            placeholder="Qtd"
            className="h-8"
            max={currentItemId ? entradaItens.find(i => i.id === currentItemId)?.quantidade : undefined}
          />
        </div>
        <div className="flex items-end">
          <Button 
            size="sm"
            variant="outline"
            onClick={handleAddToSelection}
            disabled={!currentItemId || !currentQuantidade}
            className="h-8 w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Lista de itens selecionados */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Itens selecionados para este pallet:</Label>
          <div className="space-y-2 p-3 bg-muted/30 rounded border">
            {selectedItems.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{item.nome}</span>
                  {item.codigo && (
                    <span className="text-xs text-muted-foreground ml-1">({item.codigo})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => handleUpdateQuantidade(item.itemId, e.target.value)}
                    className="w-16 h-7 text-xs"
                    max={item.maxQuantidade}
                    min={1}
                  />
                  <span className="text-xs text-muted-foreground">/ {item.maxQuantidade}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFromSelection(item.itemId)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-2 border-t">
              <Button 
                size="sm"
                onClick={handleConfirmSelection}
                disabled={selectedItems.length === 0 || isLoading}
                className="h-8"
              >
                {isLoading ? "Adicionando..." : `Confirmar ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {getFilteredAvailableItems().length === 0 && selectedItems.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Todos os produtos já foram alocados em pallets
        </p>
      )}
    </div>
  )
}