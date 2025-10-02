import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSimuladorFrete } from "@/hooks/useSimuladorFrete"
import { useProfile, useFazendas } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, Calculator, MapPin } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Coordinates } from "@/services/routingService"

interface SimuladorFreteProps {
  pesoTotal: number
  onFreteCalculado?: (resultado: any) => void
  franquiaCoords?: Coordinates
  fazendaCoords?: Coordinates
  franquiaNome?: string
  fazendaNome?: string
  fazendaId?: string
  onFazendaChange?: (fazendaId: string) => void
  produtorDestinatarioId?: string
}

export function SimuladorFrete({ 
  pesoTotal, 
  onFreteCalculado, 
  franquiaCoords, 
  fazendaCoords,
  franquiaNome,
  fazendaNome,
  fazendaId,
  onFazendaChange,
  produtorDestinatarioId
}: SimuladorFreteProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  
  // Buscar fazendas do produtor
  const isProdutor = profile?.role === 'produtor'
  const targetProdutorId = isProdutor ? user?.id : produtorDestinatarioId
  const { data: fazendas = [], isLoading: loadingFazendas } = useFazendas(targetProdutorId)

  const { 
    simulacao, 
    setSimulacao, 
    calcularFrete, 
    calcularDistanciaAutomatica,
    isCalculatingDistance 
  } = useSimuladorFrete()
  const [calculando, setCalculando] = useState(false)

  const handleCalcularDistancia = async () => {
    if (!franquiaCoords || !fazendaCoords) {
      toast.error("Coordenadas não disponíveis para calcular distância")
      return
    }

    try {
      await calcularDistanciaAutomatica(franquiaCoords, fazendaCoords)
      toast.success("Distância calculada automaticamente!")
    } catch (error: any) {
      console.error("Erro ao calcular distância:", error)
      toast.error(error.message || "Erro ao calcular distância")
    }
  }

  const handleCalcular = async () => {
    console.log("Tentando calcular frete:", { 
      franquiaNome, 
      fazendaNome, 
      distancia: simulacao.distancia, 
      pesoTotal 
    })
    
    if (!simulacao.distancia || pesoTotal <= 0) {
      toast.error("Informe a distância para calcular o frete")
      return
    }

    setCalculando(true)
    
    try {
      // Usar peso total dos itens
      const simulacaoComPeso = {
        ...simulacao,
        origem: franquiaNome || 'Franquia',
        destino: fazendaNome || 'Fazenda',
        peso: pesoTotal.toString()
      }
      setSimulacao(simulacaoComPeso)
      
      // Calcular usando o user_id como franqueado_id para franqueados
      const franqueadoId = profile?.role === 'franqueado' ? profile.user_id : undefined
      const resultado = await calcularFrete(franqueadoId, pesoTotal)
      
      if (resultado && onFreteCalculado) {
        onFreteCalculado(resultado)
      }
      
      toast.success("Frete calculado com sucesso!")
    } catch (error: any) {
      console.error("Erro ao calcular frete:", error)
      toast.error(error.message || "Erro ao calcular frete")
    } finally {
      setCalculando(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Simulador de Frete
        </CardTitle>
        <CardDescription>
          Calcule o frete para entrega na fazenda. Origem: {franquiaNome || 'Franquia'} → Destino: {fazendaNome || 'Fazenda'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de Fazenda de Destino */}
        <div className="space-y-2">
          <Label htmlFor="fazenda_id">Fazenda de Destino *</Label>
          <Select value={fazendaId} onValueChange={onFazendaChange}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="distancia">Distância (km)</Label>
            <div className="flex gap-2">
              <Input
                id="distancia"
                type="number"
                placeholder="Ex: 408"
                value={simulacao.distancia}
                onChange={(e) => setSimulacao(prev => ({ ...prev, distancia: e.target.value }))}
              />
              {franquiaCoords && fazendaCoords && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCalcularDistancia}
                  disabled={isCalculatingDistance}
                  className="shrink-0"
                  title="Calcular distância automaticamente"
                >
                  {isCalculatingDistance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="peso">Peso Total (kg)</Label>
            <Input
              id="peso"
              type="number"
              value={pesoTotal}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <Button 
          onClick={handleCalcular} 
          disabled={calculando || pesoTotal <= 0 || !simulacao.distancia || parseFloat(simulacao.distancia) <= 0}
          className="w-full"
        >
          {calculando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Frete
            </>
          )}
        </Button>

        {simulacao.resultado && (
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-semibold text-foreground">Resultado do Cálculo</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tabela:</span>
                <p className="font-medium">{simulacao.resultado.tabela_nome}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Prazo:</span>
                <p className="font-medium">{simulacao.resultado.prazo_entrega} dias úteis</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Valor do Frete:</span>
                <p className="font-medium">{formatarMoeda(simulacao.resultado.valor_frete)}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Pedágio:</span>
                <p className="font-medium">{formatarMoeda(simulacao.resultado.valor_pedagio)}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary">
                  {formatarMoeda(simulacao.resultado.valor_total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}