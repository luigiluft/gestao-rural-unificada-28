import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle } from "lucide-react"
import { DadosSaida } from "../types/formulario.types"
import { useProximoNumeroNfe } from "@/hooks/useProximoNumeroNfe"
import { useChaveNFeAutomatica } from "@/hooks/useChaveNFeAutomatica"
import { useEffect } from "react"

interface NFeObservacoesSectionProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

export function NFeObservacoesSection({ dados, onDadosChange }: NFeObservacoesSectionProps) {
  const serieAtual = dados.serie_nfe || '1'
  const { data: proximoNumeroNfe } = useProximoNumeroNfe(serieAtual, dados.depositoId)

  const { chave: chaveGerada, valido: chaveValida } = useChaveNFeAutomatica({
    depositoId: dados.depositoId,
    serie: serieAtual,
    numeroNfe: dados.numero_nfe || '',
    enabled: !!dados.depositoId && !!dados.numero_nfe
  })

  // Atualizar número NFe quando mudar série ou quando carregar próximo número
  useEffect(() => {
    if (proximoNumeroNfe && proximoNumeroNfe !== dados.numero_nfe) {
      onDadosChange({ ...dados, numero_nfe: proximoNumeroNfe })
    }
  }, [proximoNumeroNfe])

  // Inicializar série padrão
  useEffect(() => {
    if (!dados.serie_nfe) {
      onDadosChange({ ...dados, serie_nfe: '1' })
    }
  }, [])

  // Atualizar chave NFe quando for gerada automaticamente
  useEffect(() => {
    if (chaveGerada && chaveValida && chaveGerada !== dados.chave_nfe) {
      onDadosChange({ ...dados, chave_nfe: chaveGerada })
    }
  }, [chaveGerada, chaveValida])

  const handleChange = (campo: keyof DadosSaida, valor: string) => {
    onDadosChange({ ...dados, [campo]: valor })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          NFe e Observações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campos NFe */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero_nfe">Nº NFe</Label>
            <Input
              id="numero_nfe"
              value={dados.numero_nfe || ''}
              disabled
              className="bg-muted"
              placeholder="Gerado automaticamente"
            />
            <p className="text-xs text-muted-foreground">Número sequencial automático</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serie_nfe">Série</Label>
            <Input
              id="serie_nfe"
              value={dados.serie_nfe || '1'}
              onChange={(e) => handleChange('serie_nfe', e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chave_nfe">Chave NFe</Label>
            <Input
              id="chave_nfe"
              value={dados.chave_nfe || ''}
              disabled
              className="bg-muted font-mono text-xs"
              placeholder="Gerada automaticamente"
            />
            {chaveValida && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Gerada automaticamente
              </p>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={dados.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            placeholder="Observações gerais sobre a saída..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
