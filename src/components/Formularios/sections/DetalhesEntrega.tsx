import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DadosSaida } from "../types/formulario.types"

interface DetalhesEntregaProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

export function DetalhesEntregaSection({ dados, onDadosChange }: DetalhesEntregaProps) {
  const handleChange = (campo: keyof DadosSaida, valor: string) => {
    onDadosChange({ ...dados, [campo]: valor })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes de Entrega</CardTitle>
        <p className="text-sm text-muted-foreground">
          Como será feita a entrega
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tipo_saida">Tipo de Saída *</Label>
          <Select value={dados.tipo_saida} onValueChange={(value) => handleChange('tipo_saida', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retirada_deposito">Retirada no Depósito</SelectItem>
              <SelectItem value="entrega_fazenda">Entrega na Fazenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
