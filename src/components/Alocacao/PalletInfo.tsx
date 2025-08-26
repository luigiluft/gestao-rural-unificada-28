import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Barcode, MapPin } from "lucide-react"

interface PalletInfoProps {
  pallet: {
    codigo_barras_pallet: string
    entrada_pallets: {
      numero_pallet: number
      descricao: string
      entrada_pallet_itens: Array<{
        quantidade: number
        entrada_itens: {
          nome_produto: string
          lote: string
          quantidade: number
        }
      }>
    }
  }
  currentIndex: number
  totalPallets: number
  currentPosition?: {
    codigo: string
    descricao?: string
  }
}

export const PalletInfo = ({ pallet, currentIndex, totalPallets, currentPosition }: PalletInfoProps) => {
  const totalItens = pallet.entrada_pallets.entrada_pallet_itens.length
  const totalQuantidade = pallet.entrada_pallets.entrada_pallet_itens.reduce(
    (sum, item) => sum + item.quantidade, 0
  )

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Pallet {pallet.entrada_pallets.numero_pallet}
          </CardTitle>
          <Badge variant="outline">
            {currentIndex + 1} de {totalPallets}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Barcode className="h-4 w-4" />
          <span className="font-mono">{pallet.codigo_barras_pallet}</span>
        </div>
        
        {currentPosition && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Posição de Armazenamento:</span>
              <span className="font-bold text-primary text-base">{currentPosition.codigo}</span>
            </div>
            {currentPosition.descricao && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {currentPosition.descricao}
              </p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Itens:</span>
            <span className="ml-1 font-medium">{totalItens} produtos</span>
          </div>
          <div>
            <span className="text-muted-foreground">Quantidade:</span>
            <span className="ml-1 font-medium">{totalQuantidade} unidades</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}