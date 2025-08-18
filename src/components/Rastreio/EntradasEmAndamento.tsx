import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Calendar, Building2, Package } from "lucide-react"
import { StatusIndicator } from "./StatusIndicator"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Entrada {
  id: string
  numero_nfe?: string
  data_entrada: string
  status_aprovacao: string
  valor_total?: number
  fornecedores?: { nome: string }
  franquia_nome?: string
  entrada_itens: Array<{
    quantidade: number
    produtos?: { nome: string }
  }>
}

interface EntradasEmAndamentoProps {
  entradas: Entrada[]
  isLoading: boolean
}

export const EntradasEmAndamento = ({ entradas, isLoading }: EntradasEmAndamentoProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            A Caminho
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

  if (entradas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            A Caminho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma entrada em trânsito no momento</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          A Caminho ({entradas.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entradas.map((entrada) => (
            <div key={entrada.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">
                    NF {entrada.numero_nfe || entrada.id.slice(0, 8)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {entrada.fornecedores?.nome || "Fornecedor não identificado"}
                  </p>
                </div>
                <StatusIndicator status={entrada.status_aprovacao} type="entrada" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(entrada.data_entrada), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{entrada.franquia_nome || "Franquia não definida"}</span>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {entrada.entrada_itens.length} {entrada.entrada_itens.length === 1 ? "item" : "itens"}
                </div>
                {entrada.valor_total && (
                  <Badge variant="outline">
                    R$ {entrada.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}