import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DadosSaida } from "../types/formulario.types"
import { useFazendas, useProfile } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"

interface DetalhesEntregaProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

export function DetalhesEntregaSection({ dados, onDadosChange }: DetalhesEntregaProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  
  const isProdutor = profile?.role === 'produtor'
  const targetProdutorId = isProdutor ? user?.id : dados.produtor_destinatario
  const { data: fazendas = [], isLoading: loadingFazendas } = useFazendas(targetProdutorId)

  const handleChange = (campo: keyof DadosSaida, valor: string) => {
    onDadosChange({ ...dados, [campo]: valor })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes de Entrega</CardTitle>
        <p className="text-sm text-muted-foreground">
          Como e para onde será feita a entrega
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Mostrar seleção de fazenda quando há produtor selecionado e tipo é entrega */}
          {(dados.tipo_saida === 'entrega_fazenda' && (isProdutor || dados.produtor_destinatario)) && (
            <div className="space-y-2">
              <Label htmlFor="fazenda_id">Fazenda de Destino</Label>
              <Select value={dados.fazenda_id} onValueChange={(value) => handleChange('fazenda_id', value)}>
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      loadingFazendas 
                        ? "Carregando fazendas..." 
                        : fazendas.length === 0 && targetProdutorId
                          ? "Nenhuma fazenda cadastrada"
                          : "Selecione a fazenda"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {fazendas?.map((fazenda) => (
                    <SelectItem key={fazenda.id} value={fazenda.id}>
                      {fazenda.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
