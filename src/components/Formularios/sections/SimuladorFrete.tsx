import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCalcularFreteMultiplasTabelas } from "@/hooks/useCalcularFreteMultiplasTabelas"
import { useProfile } from "@/hooks/useProfile"
import { useLocaisEntregaUnificados } from "@/hooks/useLocaisEntregaUnificados"
import { useAuth } from "@/contexts/AuthContext"
import { useCliente } from "@/contexts/ClienteContext"
import { Loader2, Calculator, MapPin, Building2, Tractor, MapPinned, PenLine } from "lucide-react"
import { useState, useEffect } from "react"
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
  enderecoAvulso?: {
    endereco: string
    cidade: string
    estado: string
    cep: string
  }
  onEnderecoAvulsoChange?: (endereco: { endereco: string; cidade: string; estado: string; cep: string } | null) => void
}

const ENDERECO_AVULSO_ID = "__endereco_avulso__"

export function SimuladorFrete({ 
  pesoTotal, 
  onFreteCalculado, 
  franquiaCoords, 
  fazendaCoords,
  franquiaNome,
  fazendaNome,
  fazendaId,
  onFazendaChange,
  produtorDestinatarioId,
  enderecoAvulso,
  onEnderecoAvulsoChange
}: SimuladorFreteProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { selectedCliente } = useCliente()
  
  // Buscar locais de entrega unificados do cliente destinatário
  const targetClienteId = produtorDestinatarioId
  const { data: locaisEntrega = [], isLoading: loadingLocais } = useLocaisEntregaUnificados(targetClienteId)

  const { calcularFreteTodasTabelas, calculando } = useCalcularFreteMultiplasTabelas()
  
  const [distancia, setDistancia] = useState<string>('')
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [resultados, setResultados] = useState<any[]>([])
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(null)
  const [showEnderecoAvulso, setShowEnderecoAvulso] = useState(fazendaId === ENDERECO_AVULSO_ID)
  const [enderecoAvulsoLocal, setEnderecoAvulsoLocal] = useState(enderecoAvulso || {
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  })
  const [coordenadasLocal, setCoordenadasLocal] = useState<Coordinates | null>(null)

  // Inicializar coordenadas quando fazendaId já vem preenchido ou locaisEntrega carrega
  useEffect(() => {
    if (fazendaId && fazendaId !== ENDERECO_AVULSO_ID && locaisEntrega.length > 0) {
      const local = locaisEntrega.find(l => l.id === fazendaId)
      if (local?.latitude && local?.longitude) {
        setCoordenadasLocal({ latitude: local.latitude, longitude: local.longitude })
      } else {
        setCoordenadasLocal(null)
      }
    } else if (fazendaId === ENDERECO_AVULSO_ID) {
      setCoordenadasLocal(null)
    }
  }, [fazendaId, locaisEntrega])

  const handleLocalChange = (value: string) => {
    if (value === ENDERECO_AVULSO_ID) {
      setShowEnderecoAvulso(true)
      setCoordenadasLocal(null)
      onFazendaChange?.(value)
    } else {
      setShowEnderecoAvulso(false)
      onEnderecoAvulsoChange?.(null)
      onFazendaChange?.(value)
      
      // Buscar coordenadas do local selecionado
      const localSelecionado = locaisEntrega.find(l => l.id === value)
      if (localSelecionado?.latitude && localSelecionado?.longitude) {
        setCoordenadasLocal({
          latitude: localSelecionado.latitude,
          longitude: localSelecionado.longitude
        })
      } else {
        setCoordenadasLocal(null)
      }
    }
  }

  const handleEnderecoAvulsoFieldChange = (field: string, value: string) => {
    const updated = { ...enderecoAvulsoLocal, [field]: value }
    setEnderecoAvulsoLocal(updated)
    onEnderecoAvulsoChange?.(updated)
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'fazenda': return <Tractor className="h-4 w-4 text-green-600" />
      case 'deposito': return <Building2 className="h-4 w-4 text-blue-600" />
      case 'local_entrega': return <MapPinned className="h-4 w-4 text-orange-600" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'fazenda': return 'Fazenda'
      case 'deposito': return 'Depósito'
      case 'local_entrega': return 'Local'
      default: return ''
    }
  }

  // Usar coordenadas locais (do local selecionado) ou as props como fallback
  const coordenadasDestino = coordenadasLocal || fazendaCoords

  const handleCalcularDistancia = async () => {
    if (!franquiaCoords || !coordenadasDestino) {
      toast.error("Coordenadas não disponíveis para calcular distância")
      return
    }

    setIsCalculatingDistance(true)
    try {
      const distanciaCalculada = await calculateDistance(franquiaCoords, coordenadasDestino)
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

    if (!selectedCliente?.id) {
      toast.error("Selecione uma empresa para calcular frete")
      return
    }

    try {
      const resultadosCalculo = await calcularFreteTodasTabelas(
        selectedCliente.id,
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
          Calcule o frete para entrega. Origem: {franquiaNome || 'Depósito'} → Destino: {fazendaNome || 'Local de Entrega'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de Local de Entrega */}
        <div className="space-y-2">
          <Label htmlFor="local_entrega_id">Local de Entrega *</Label>
          <Select value={fazendaId} onValueChange={handleLocalChange}>
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  loadingLocais 
                    ? "Carregando locais..." 
                    : locaisEntrega.length === 0 && targetClienteId
                      ? "Nenhum local cadastrado"
                      : "Selecione o local de entrega"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {locaisEntrega?.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  <div className="flex items-center gap-2">
                    {getTipoIcon(local.tipo)}
                    <span>{local.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      ({getTipoLabel(local.tipo)}{local.cidade ? ` - ${local.cidade}/${local.estado}` : ''})
                    </span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value={ENDERECO_AVULSO_ID}>
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-purple-600" />
                  <span>Informar endereço diferente</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos de endereço avulso */}
        {showEnderecoAvulso && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Label className="text-sm font-medium">Endereço de Entrega (não será salvo)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="Endereço completo"
                  value={enderecoAvulsoLocal.endereco}
                  onChange={(e) => handleEnderecoAvulsoFieldChange('endereco', e.target.value)}
                />
              </div>
              <Input
                placeholder="Cidade"
                value={enderecoAvulsoLocal.cidade}
                onChange={(e) => handleEnderecoAvulsoFieldChange('cidade', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="UF"
                  maxLength={2}
                  value={enderecoAvulsoLocal.estado}
                  onChange={(e) => handleEnderecoAvulsoFieldChange('estado', e.target.value.toUpperCase())}
                />
                <Input
                  placeholder="CEP"
                  value={enderecoAvulsoLocal.cep}
                  onChange={(e) => handleEnderecoAvulsoFieldChange('cep', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

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
              {franquiaCoords && coordenadasDestino && (
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