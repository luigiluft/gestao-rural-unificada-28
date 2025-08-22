import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Package } from "lucide-react"

interface ProductInfoProps {
  currentItem: any
}

export function ProductInfo({ currentItem }: ProductInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Produto Atual
        </CardTitle>
        <CardDescription>
          Informações do produto para alocação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="font-medium">Nome do Produto</Label>
          <p className="text-lg">{currentItem.produtos?.nome}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="font-medium">Lote</Label>
            <p>{currentItem.lote || '-'}</p>
          </div>
          <div>
            <Label className="font-medium">Quantidade</Label>
            <p>{currentItem.quantidade} {currentItem.produtos?.unidade_medida}</p>
          </div>
        </div>

        {currentItem.entrada_itens && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Validade</Label>
              <p>{currentItem.entrada_itens.data_validade ? 
                new Date(currentItem.entrada_itens.data_validade).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <Label className="font-medium">Valor Unitário</Label>
              <p>R$ {currentItem.entrada_itens.valor_unitario?.toFixed(2) || '0,00'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}