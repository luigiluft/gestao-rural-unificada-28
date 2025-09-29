import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Warehouse, Package, AlertTriangle, Building2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { isAfter, addDays } from "date-fns"

interface EstoqueItem {
  produto_id: string
  deposito_id: string
  user_id: string
  lote: string
  quantidade_atual: number
  valor_unitario: number
  valor_total: number
  produtos: { 
    nome: string
    codigo?: string
    unidade_medida: string
  }
  franquias?: {
    nome: string
  } | null
}

interface EstoqueAtualProps {
  estoque: EstoqueItem[]
  isLoading: boolean
}

export const EstoqueAtual = ({ estoque, isLoading }: EstoqueAtualProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            No Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (estoque.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            No Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto em estoque no momento</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getValidityStatus = (dataValidade?: string) => {
    if (!dataValidade) return null
    
    const validityDate = new Date(dataValidade)
    const warningDate = addDays(new Date(), 30) // 30 dias de antecedência
    
    if (isAfter(new Date(), validityDate)) {
      return { type: "expired", label: "Vencido", variant: "destructive" as const }
    } else if (isAfter(warningDate, validityDate)) {
      return { type: "warning", label: "Vence em breve", variant: "outline" as const }
    }
    return null
  }

  // Group by franquia
  const estoqueByFranquia = estoque.reduce((acc, item) => {
    const franquia = item.franquias?.nome || "Franquia não definida"
    if (!acc[franquia]) acc[franquia] = []
    acc[franquia].push(item)
    return acc
  }, {} as Record<string, EstoqueItem[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5 text-primary" />
          No Estoque ({estoque.length} {estoque.length === 1 ? "item" : "itens"})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(estoqueByFranquia).map(([franquia, items]) => (
            <div key={franquia}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">{franquia}</h4>
                <Badge variant="secondary" className="ml-auto">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => {
                  const validityStatus = getValidityStatus(undefined) // Data de validade não está mais disponível
                  
                  return (
                    <div key={`${item.produto_id}-${item.lote}`} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium">
                            {item.produtos?.nome || "Produto não identificado"}
                          </h5>
                          {item.lote && (
                            <p className="text-sm text-muted-foreground">Lote: {item.lote}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {validityStatus && (
                            <Badge variant={validityStatus.variant} className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {validityStatus.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantidade: </span>
                          <span className="font-medium">
                            {item.quantidade_atual.toLocaleString("pt-BR")} {item.produtos?.unidade_medida || "UN"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor unitário: </span>
                          <span className="font-medium">
                            R$ {item.valor_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Valor total: R$ {item.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}