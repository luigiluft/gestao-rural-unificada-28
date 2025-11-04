import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCalcularFreteMultiplasTabelas } from "@/hooks/useCalcularFreteMultiplasTabelas"
import { useProfile, useFazendas } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, Calculator, MapPin } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Coordinates } from "@/services/routingService"
import { calculateDistance } from "@/services/routingService"

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

  const { calcularFreteTodasTabelas, calculando } = useCalcularFreteMultiplasTabelas()
  
  const [distancia, setDistancia] = useState<string>('')
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [resultados, setResultados] = useState<any[]>([])
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(null)

  const handleCalcularDistancia = async () => {
    if (!franquiaCoords || !fazendaCoords) {
      toast.error("Coordenadas não disponíveis para calcular distância")
      return
    }

    setIsCalculatingDistance(true)
    try {
      const distanciaCalculada = await calculateDistance(franquiaCoords, fazendaCoords)
      setDistancia(distanciaCalculada.toString())
      toast.success("Distância calculada automaticamente!")
    } catch (error: any) {
      console.error("Erro ao calcular distância:", error)
      toast.error(error.message || "Erro ao calcular distância")
    } finally {
      setIsCalculatingDistance(false)
    }
  }

  const handleCalcular = async () => {
    if (!distancia || parseFloat(distancia) <= 0 || pesoTotal <= 0) {
      toast.error("Informe a distância para calcular o frete")
      return
    }

    if (!profile?.user_id || profile.role !== 'franqueado') {
      toast.error("Apenas franqueados podem calcular frete")
      return
    }

    try {
      const resultadosCalculo = await calcularFreteTodasTabelas(
        profile.user_id,
        parseFloat(distancia),
        pesoTotal
      )

      if (resultadosCalculo.length === 0) {
        toast.error("Nenhuma tabela de frete se aplica a esta distância")
        return
      }

      setResultados(resultadosCalculo)
      
      // Auto-selecionar a primeira tabela (melhor preço) por padrão
      if (resultadosCalculo.length > 0) {
        setTabelaSelecionada(resultadosCalculo[0].tabela_id)
        if (onFreteCalculado) {
          const melhorResultado = resultadosCalculo[0]
          onFreteCalculado({
            ...melhorResultado,
            distancia_km: parseFloat(distancia),
            origem: franquiaNome,
            destino: fazendaNome
          })
        }
      }
      
      toast.success(`${resultadosCalculo.length} tabela(s) calculada(s) com sucesso!`)
    } catch (error: any) {
      console.error("Erro ao calcular frete:", error)
      toast.error(error.message || "Erro ao calcular frete")
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
                value={distancia}
                onChange={(e) => setDistancia(e.target.value)}
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
          disabled={calculando || pesoTotal <= 0 || !distancia || parseFloat(distancia) <= 0}
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

        {resultados.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-foreground">
              Resultados de {resultados.length} Tabela(s) de Frete - Selecione uma opção
            </h4>
            
            {resultados.map((resultado, index) => (
              <button
                type="button"
                key={resultado.tabela_id}
                onClick={() => {
                  setTabelaSelecionada(resultado.tabela_id)
                  if (onFreteCalculado) {
                    onFreteCalculado({
                      ...resultado,
                      distancia_km: parseFloat(distancia),
                      origem: franquiaNome,
                      destino: fazendaNome
                    })
                  }
                }}
                className={`w-full p-4 rounded-lg space-y-3 text-left transition-all ${
                  tabelaSelecionada === resultado.tabela_id
                    ? 'bg-primary/10 border-2 border-primary shadow-md' 
                    : 'bg-muted border border-border hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h5 className="font-semibold text-foreground">
                    {resultado.tabela_nome}
                  </h5>
                  <div className="flex gap-2">
                    {index === 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Melhor Preço
                      </span>
                    )}
                    {tabelaSelecionada === resultado.tabela_id && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Selecionada
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Prazo:</span>
                    <p className="font-medium">{resultado.prazo_entrega} dias úteis</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Valor do Frete:</span>
                    <p className="font-medium">{formatarMoeda(resultado.valor_frete)}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Pedágio:</span>
                    <p className="font-medium">{formatarMoeda(resultado.valor_pedagio)}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className={`font-bold ${tabelaSelecionada === resultado.tabela_id ? 'text-primary' : ''}`}>
                      {formatarMoeda(resultado.valor_total)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}