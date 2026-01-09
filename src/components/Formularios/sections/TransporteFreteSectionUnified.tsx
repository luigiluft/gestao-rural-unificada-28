import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DadosSaida, ItemGenerico } from "../types/formulario.types"
import { useTransportadoras } from "@/hooks/useTransportadoras"
import { useCliente } from "@/contexts/ClienteContext"
import { useLocaisEntregaUnificados } from "@/hooks/useLocaisEntregaUnificados"
import { useCalcularFreteMultiplasTabelas } from "@/hooks/useCalcularFreteMultiplasTabelas"
import { calculateDistance } from "@/services/routingService"
import { Truck, DollarSign, Settings2, Calculator, MapPin, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Coordinates } from "@/services/routingService"

interface TransporteFreteSectionProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
  itens?: ItemGenerico[]
  produtosInfo?: Array<{ id: string; package_capacity?: number; containers_per_package?: number }>
  franquiaCoords?: Coordinates
  franquiaNome?: string
  pesoTotal: number
}

const MODALIDADES_FRETE = [
  { value: '0', label: '0 - Por conta do Emitente (CIF)' },
  { value: '1', label: '1 - Por conta do Destinatário (FOB)' },
  { value: '2', label: '2 - Por conta de Terceiros' },
  { value: '9', label: '9 - Sem Frete' }
]

export function TransporteFreteSectionUnified({ 
  dados, 
  onDadosChange, 
  itens = [], 
  produtosInfo = [],
  franquiaCoords,
  franquiaNome,
  pesoTotal
}: TransporteFreteSectionProps) {
  const { selectedCliente } = useCliente()
  const { data: transportadoras = [] } = useTransportadoras(selectedCliente?.id)
  const [multiplicadorPesoBruto, setMultiplicadorPesoBruto] = useState(1.2)
  
  // Simulador de frete states
  const { calcularFreteTodasTabelas, calculando } = useCalcularFreteMultiplasTabelas()
  const [distancia, setDistancia] = useState<string>('')
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [resultados, setResultados] = useState<any[]>([])
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(null)
  
  // Buscar locais de entrega para obter coordenadas
  const { data: locaisEntrega = [] } = useLocaisEntregaUnificados(dados.cliente_destinatario_id)
  
  // Coordenadas do local de entrega selecionado
  const [localCoords, setLocalCoords] = useState<Coordinates | null>(null)
  
  useEffect(() => {
    if (dados.local_entrega_id && locaisEntrega.length > 0) {
      const local = locaisEntrega.find(l => l.id === dados.local_entrega_id)
      if (local?.latitude && local?.longitude) {
        setLocalCoords({ latitude: local.latitude, longitude: local.longitude })
      } else {
        setLocalCoords(null)
      }
    } else {
      setLocalCoords(null)
    }
  }, [dados.local_entrega_id, locaisEntrega])

  // Calcular quantidade de volumes e pesos automaticamente a partir dos itens
  useEffect(() => {
    if (itens.length === 0) return

    let totalVolumes = 0
    let totalPesoLiquido = 0

    itens.forEach(item => {
      const produto = produtosInfo.find(p => p.id === item.produto_id)
      const packageCapacity = produto?.package_capacity || 10
      const volumes = Math.ceil(item.quantidade / packageCapacity)
      totalVolumes += volumes
      totalPesoLiquido += item.quantidade || 0
    })

    const totalPesoBruto = totalPesoLiquido * multiplicadorPesoBruto

    if (
      dados.quantidade_volumes !== totalVolumes ||
      Math.abs((dados.peso_liquido || 0) - totalPesoLiquido) > 0.001 ||
      Math.abs((dados.peso_bruto || 0) - totalPesoBruto) > 0.001
    ) {
      onDadosChange({
        ...dados,
        quantidade_volumes: totalVolumes,
        peso_liquido: totalPesoLiquido,
        peso_bruto: totalPesoBruto
      })
    }
  }, [itens, produtosInfo, multiplicadorPesoBruto])

  const handleMultiplicadorChange = (value: string) => {
    const mult = parseFloat(value) || 1.2
    setMultiplicadorPesoBruto(mult)
    
    if (dados.peso_liquido) {
      onDadosChange({
        ...dados,
        peso_bruto: dados.peso_liquido * mult
      })
    }
  }

  const handleModalidadeChange = (value: string) => {
    const modalidade = value as '0' | '1' | '2' | '9'
    onDadosChange({
      ...dados,
      modalidade_frete: modalidade,
      transportadora_id: undefined
    })
  }

  const handleTransportadoraChange = (transportadoraId: string) => {
    onDadosChange({
      ...dados,
      transportadora_id: transportadoraId
    })
  }

  const handleValorChange = (field: 'valor_frete' | 'valor_seguro' | 'peso_bruto' | 'peso_liquido', value: string) => {
    const numValue = parseFloat(value) || 0
    
    if (field === 'peso_liquido') {
      onDadosChange({
        ...dados,
        peso_liquido: numValue,
        peso_bruto: numValue * multiplicadorPesoBruto
      })
    } else {
      onDadosChange({
        ...dados,
        [field]: numValue
      })
    }
  }

  const handleQuantidadeVolumesChange = (value: string) => {
    const numValue = parseInt(value) || 0
    onDadosChange({
      ...dados,
      quantidade_volumes: numValue
    })
  }

  // Simulador de frete functions
  const handleCalcularDistancia = async () => {
    if (!franquiaCoords || !localCoords) {
      toast.error("Coordenadas não disponíveis para calcular distância")
      return
    }

    setIsCalculatingDistance(true)
    try {
      const distanciaCalculada = await calculateDistance(franquiaCoords, localCoords)
      setDistancia(distanciaCalculada.toString())
      toast.success("Distância calculada automaticamente!")
    } catch (error: any) {
      console.error("Erro ao calcular distância:", error)
      toast.error(error.message || "Erro ao calcular distância")
    } finally {
      setIsCalculatingDistance(false)
    }
  }

  const handleCalcularFrete = async () => {
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
      
      if (resultadosCalculo.length > 0) {
        setTabelaSelecionada(resultadosCalculo[0].tabela_id)
        const melhorResultado = resultadosCalculo[0]
        onDadosChange({
          ...dados,
          valor_frete: melhorResultado.valor_total,
          valor_frete_calculado: melhorResultado.valor_total,
          prazo_entrega_calculado: melhorResultado.prazo_entrega,
          frete_origem: franquiaNome,
          frete_destino: locaisEntrega.find(l => l.id === dados.local_entrega_id)?.nome || '',
          frete_distancia: parseFloat(distancia)
        })
      }
      
      toast.success(`${resultadosCalculo.length} tabela(s) calculada(s) com sucesso!`)
    } catch (error: any) {
      console.error("Erro ao calcular frete:", error)
      toast.error(error.message || "Erro ao calcular frete")
    }
  }

  const handleSelecionarTabela = (resultado: any) => {
    setTabelaSelecionada(resultado.tabela_id)
    
    // Buscar transportadora associada à tabela selecionada
    const transportadoraAssociada = transportadoras.find(t => t.nome === resultado.transportadora_nome)
    
    onDadosChange({
      ...dados,
      valor_frete: resultado.valor_total,
      valor_frete_calculado: resultado.valor_total,
      prazo_entrega_calculado: resultado.prazo_entrega,
      frete_origem: franquiaNome,
      frete_destino: locaisEntrega.find(l => l.id === dados.local_entrega_id)?.nome || '',
      frete_distancia: parseFloat(distancia),
      transportadora_id: transportadoraAssociada?.id
    })
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const transportadoraSelecionada = transportadoras.find(t => t.id === dados.transportadora_id)
  
  // Mostra seletor de transportadora manual apenas quando modalidade = Terceiros
  const showTransportadoraSelector = dados.modalidade_frete === '2'
  
  // Mostra simulador de frete para CIF (modalidade 0) com tipo entrega e peso > 0
  const showSimuladorFrete = dados.tipo_saida === 'entrega_fazenda' && 
    dados.modalidade_frete === '0' && 
    pesoTotal > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Transporte e Frete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modalidade de Frete */}
        <div className="space-y-2">
          <Label>Modalidade de Frete *</Label>
          <Select 
            value={dados.modalidade_frete || ''} 
            onValueChange={handleModalidadeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a modalidade de frete" />
            </SelectTrigger>
            <SelectContent>
              {MODALIDADES_FRETE.map(mod => (
                <SelectItem key={mod.value} value={mod.value}>
                  {mod.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info para modalidade CIF - usar simulador abaixo */}
        {dados.modalidade_frete === '0' && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Para frete CIF, utilize o simulador abaixo para calcular e selecionar a melhor transportadora.
            </p>
          </div>
        )}

        {/* Seletor de transportadora */}
        {showTransportadoraSelector && (
          <div className="space-y-2">
            <Label>Transportadora</Label>
            <Select
              value={dados.transportadora_id || ''}
              onValueChange={handleTransportadoraChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a transportadora" />
              </SelectTrigger>
              <SelectContent>
                {transportadoras.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} - {t.cnpj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {transportadoraSelecionada && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">CNPJ:</span> {transportadoraSelecionada.cnpj}
                </p>
                {transportadoraSelecionada.email && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Email:</span> {transportadoraSelecionada.email}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info quando modalidade é FOB ou sem frete */}
        {dados.modalidade_frete === '1' && (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              O frete será de responsabilidade do destinatário.
            </p>
          </div>
        )}

        {dados.modalidade_frete === '9' && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Operação sem frete. Nenhuma transportadora será vinculada.
            </p>
          </div>
        )}

        {/* Simulador de Frete Integrado - só aparece para entrega + CIF + peso > 0 */}
        {showSimuladorFrete && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Calcular Frete</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
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
                  {franquiaCoords && localCoords && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCalcularDistancia}
                      disabled={isCalculatingDistance}
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
                <Label>Peso Total (kg)</Label>
                <Input
                  type="number"
                  value={pesoTotal}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleCalcularFrete} 
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
                      Calcular
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Resultados do cálculo */}
            {resultados.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {resultados.length} tabela(s) disponível(is) - selecione uma opção:
                </Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {resultados.map((resultado, index) => (
                    <button
                      type="button"
                      key={resultado.tabela_id}
                      onClick={() => handleSelecionarTabela(resultado)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        tabelaSelecionada === resultado.tabela_id
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-muted/50 border border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-sm">{resultado.tabela_nome}</span>
                          {resultado.transportadora_nome && (
                            <span className="text-xs text-muted-foreground ml-2">
                              via {resultado.transportadora_nome}
                            </span>
                          )}
                          {resultado.is_propria && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded ml-2">
                              Própria
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {index === 0 && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              Melhor
                            </span>
                          )}
                          <span className="font-bold text-sm">
                            {formatarMoeda(resultado.valor_total)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Frete: {formatarMoeda(resultado.valor_frete)} | Pedágio: {formatarMoeda(resultado.valor_pedagio)} | Prazo: {resultado.prazo_entrega} dias
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Transportadora selecionada via simulador */}
            {tabelaSelecionada && transportadoraSelecionada && dados.modalidade_frete === '0' && (
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm">
                  <span className="font-medium">Transportadora selecionada:</span> {transportadoraSelecionada.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  CNPJ: {transportadoraSelecionada.cnpj}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Volumes e Peso */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Volumes e Peso</span>
            <span className="text-xs text-muted-foreground ml-auto">(calculado dos itens)</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade_volumes">Qtd. Volumes</Label>
              <Input
                id="quantidade_volumes"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={dados.quantidade_volumes || ''}
                onChange={(e) => handleQuantidadeVolumesChange(e.target.value)}
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_liquido">Peso Líquido (kg)</Label>
              <Input
                id="peso_liquido"
                type="number"
                step="0.001"
                min="0"
                placeholder="0,000"
                value={dados.peso_liquido || ''}
                onChange={(e) => handleValorChange('peso_liquido', e.target.value)}
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_bruto">Peso Bruto (kg)</Label>
              <Input
                id="peso_bruto"
                type="number"
                step="0.001"
                min="0"
                placeholder="0,000"
                value={dados.peso_bruto || ''}
                onChange={(e) => handleValorChange('peso_bruto', e.target.value)}
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplicador" className="flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Multiplicador
              </Label>
              <Input
                id="multiplicador"
                type="number"
                step="0.1"
                min="1"
                max="2"
                placeholder="1.2"
                value={multiplicadorPesoBruto}
                onChange={(e) => handleMultiplicadorChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Valores de Frete e Seguro */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Valores</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_frete">Valor do Frete (R$)</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={dados.valor_frete || ''}
                onChange={(e) => handleValorChange('valor_frete', e.target.value)}
                className={resultados.length > 0 ? "bg-primary/5 border-primary/30" : "bg-muted/30"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_seguro">Valor do Seguro (R$)</Label>
              <Input
                id="valor_seguro"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={dados.valor_seguro || ''}
                onChange={(e) => handleValorChange('valor_seguro', e.target.value)}
                className="bg-muted/30"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
