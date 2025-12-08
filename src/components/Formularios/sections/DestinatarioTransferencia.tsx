import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, AlertTriangle, ArrowRightLeft } from "lucide-react"
import { DadosSaida } from "../types/formulario.types"
import { useClientesGrupoEconomico } from "@/hooks/useClientesGrupoEconomico"
import { Badge } from "@/components/ui/badge"

interface DestinatarioTransferenciaProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

export function DestinatarioTransferenciaSection({ dados, onDadosChange }: DestinatarioTransferenciaProps) {
  const { data: clientesGrupo = [], isLoading } = useClientesGrupoEconomico()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center text-muted-foreground">
            Carregando estabelecimentos...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (clientesGrupo.length === 0) {
    return (
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Nenhum estabelecimento disponível para transferência.</strong>
          <br />
          <span className="text-sm">
            Configure as filiais no menu <strong>Empresas</strong> antes de fazer transferências internas.
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Estabelecimento Destino
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
          <Building className="h-4 w-4" />
          <AlertDescription>
            <strong>Transferência interna:</strong> Selecione a filial ou matriz de destino.
            <br />
            <span className="text-sm opacity-80">
              Apenas estabelecimentos do mesmo grupo econômico aparecem aqui.
            </span>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="destinatario_transferencia">Estabelecimento Destino *</Label>
          <Select
            value={dados.destinatario_transferencia_id || ''}
            onValueChange={(value) => onDadosChange({ ...dados, destinatario_transferencia_id: value })}
          >
            <SelectTrigger id="destinatario_transferencia">
              <SelectValue placeholder="Selecione o estabelecimento destino..." />
            </SelectTrigger>
            <SelectContent>
              {clientesGrupo.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant={cliente.tipo === 'matriz' ? 'default' : 'secondary'} className="text-xs">
                      {cliente.tipo === 'matriz' ? 'Matriz' : 'Filial'}
                    </Badge>
                    <span>{cliente.razao_social}</span>
                    {cliente.cidade_fiscal && cliente.estado_fiscal && (
                      <span className="text-muted-foreground text-sm">
                        - {cliente.cidade_fiscal}/{cliente.estado_fiscal}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecione a filial ou matriz que receberá a mercadoria transferida
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
