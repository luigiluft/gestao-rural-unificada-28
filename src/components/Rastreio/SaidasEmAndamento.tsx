import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Calendar, MapPin, Package, ExternalLink } from "lucide-react"
import { StatusIndicator } from "./StatusIndicator"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Rastreamento {
  codigo_rastreamento?: string
  status_atual?: string
  transportadora?: string
  data_prevista_entrega?: string
}

interface Saida {
  id: string
  data_saida: string
  status: string
  valor_total?: number
  franquia_nome?: string
  saida_itens: Array<{
    quantidade: number
    produtos?: { nome: string }
  }>
  rastreamentos: Rastreamento[]
}

interface SaidasEmAndamentoProps {
  saidas: Saida[]
  isLoading: boolean
}

export const SaidasEmAndamento = ({ saidas, isLoading }: SaidasEmAndamentoProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Saindo
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

  if (saidas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Saindo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma saída em andamento no momento</p>
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
          Saindo ({saidas.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {saidas.map((saida) => {
            const rastreamento = saida.rastreamentos?.[0]
            
            return (
              <div key={saida.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">
                      Saída {saida.id.slice(0, 8)}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Saída de Produtos
                    </p>
                  </div>
                  <StatusIndicator status={saida.status} type="saida" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(saida.data_saida), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{saida.franquia_nome || "Origem não definida"}</span>
                  </div>
                </div>

                {rastreamento && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {rastreamento.transportadora || "Transportadora"}
                        </p>
                        {rastreamento.codigo_rastreamento && (
                          <p className="text-xs text-muted-foreground">
                            Código: {rastreamento.codigo_rastreamento}
                          </p>
                        )}
                      </div>
                      {rastreamento.codigo_rastreamento && (
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Rastrear
                        </Badge>
                      )}
                    </div>
                    {rastreamento.data_prevista_entrega && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Previsão: {format(new Date(rastreamento.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {saida.saida_itens.length} {saida.saida_itens.length === 1 ? "item" : "itens"}
                  </span>
                  {saida.valor_total && (
                    <Badge variant="outline">
                      R$ {saida.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}