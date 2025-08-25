import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, AlertTriangle, Package } from "lucide-react"
import { PalletProduct } from "@/hooks/usePalletAllocation"

interface PalletProductsCheckProps {
  products: PalletProduct[]
  onUpdateProduct: (produtoId: string, status: PalletProduct['status'], quantidadeConferida?: number, observacoes?: string) => void
}

export const PalletProductsCheck = ({ products, onUpdateProduct }: PalletProductsCheckProps) => {
  const [selectedProduct, setSelectedProduct] = useState<PalletProduct | null>(null)
  const [quantidade, setQuantidade] = useState(0)
  const [observacoes, setObservacoes] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleProductAction = (product: PalletProduct, action: 'conferido' | 'faltante' | 'danificado') => {
    if (action === 'conferido') {
      onUpdateProduct(product.produto_id, 'conferido', product.quantidade_original)
    } else {
      setSelectedProduct(product)
      setQuantidade(action === 'faltante' ? 0 : product.quantidade_original)
      setObservacoes("")
      setDialogOpen(true)
    }
  }

  const handleConfirmDivergencia = () => {
    if (!selectedProduct) return

    const status = quantidade === 0 ? 'faltante' : 'danificado'
    onUpdateProduct(selectedProduct.produto_id, status, quantidade, observacoes)
    setDialogOpen(false)
    setSelectedProduct(null)
  }

  const getStatusIcon = (status: PalletProduct['status']) => {
    switch (status) {
      case 'conferido':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'faltante':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'danificado':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: PalletProduct['status']) => {
    switch (status) {
      case 'conferido':
        return <Badge className="bg-success/10 text-success border-success/20">Conferido</Badge>
      case 'faltante':
        return <Badge variant="destructive">Faltante</Badge>
      case 'danificado':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Danificado</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conferência de Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.map((product) => (
            <div
              key={product.produto_id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(product.status)}
                <div className="flex-1">
                  <p className="font-medium">{product.nome_produto}</p>
                  <div className="text-sm text-muted-foreground space-x-4">
                    <span>Lote: {product.lote || 'N/A'}</span>
                    <span>Qtd: {product.quantidade_original}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(product.status)}
                
                {product.status === 'pendente' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success border-success/20 hover:bg-success/10"
                      onClick={() => handleProductAction(product, 'conferido')}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => handleProductAction(product, 'faltante')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-warning border-warning/20 hover:bg-warning/10"
                          onClick={() => handleProductAction(product, 'danificado')}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Divergência</DialogTitle>
            <DialogDescription>
              Produto: {selectedProduct?.nome_produto}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantidade">Quantidade Conferida</Label>
              <Input
                id="quantidade"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                min="0"
                max={selectedProduct?.quantidade_original || 0}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Quantidade original: {selectedProduct?.quantidade_original}
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva o problema encontrado..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDivergencia}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}