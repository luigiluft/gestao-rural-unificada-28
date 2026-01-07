import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DadosSaida, ItemGenerico } from "../types/formulario.types"
import { useTransportadoras } from "@/hooks/useTransportadoras"
import { useCliente } from "@/contexts/ClienteContext"
import { Truck, Building2, DollarSign, Settings2 } from "lucide-react"
import { useEffect, useState } from "react"

interface TransporteSectionProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
  itens?: ItemGenerico[]
  produtosInfo?: Array<{ id: string; package_capacity?: number; containers_per_package?: number }>
}

const MODALIDADES_FRETE = [
  { value: '0', label: '0 - Por conta do Emitente (CIF)' },
  { value: '1', label: '1 - Por conta do Destinatário (FOB)' },
  { value: '2', label: '2 - Por conta de Terceiros' },
  { value: '9', label: '9 - Sem Frete' }
]

export function TransporteSection({ dados, onDadosChange, itens = [], produtosInfo = [] }: TransporteSectionProps) {
  const { selectedCliente } = useCliente()
  const { data: transportadoras = [] } = useTransportadoras(selectedCliente?.id)
  const [multiplicadorPesoBruto, setMultiplicadorPesoBruto] = useState(1.2)

  // Calcular quantidade de volumes e pesos automaticamente a partir dos itens
  useEffect(() => {
    if (itens.length === 0) return

    let totalVolumes = 0
    let totalPesoLiquido = 0

    itens.forEach(item => {
      const produto = produtosInfo.find(p => p.id === item.produto_id)
      const packageCapacity = produto?.package_capacity || 10 // default 10kg
      
      // Quantidade de volumes = quantidade / package_capacity
      const volumes = Math.ceil(item.quantidade / packageCapacity)
      totalVolumes += volumes
      
      // Peso líquido = quantidade total (assumindo unidade em kg)
      totalPesoLiquido += item.quantidade || 0
    })

    const totalPesoBruto = totalPesoLiquido * multiplicadorPesoBruto

    // Atualizar somente se os valores mudaram significativamente
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

  // Atualizar peso bruto quando multiplicador muda
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
    
    // Reset transportadora fields when changing modality
    onDadosChange({
      ...dados,
      modalidade_frete: modalidade,
      transportadora_id: undefined,
      usar_transportadora_propria: modalidade === '0' ? true : false
    })
  }

  const handleTransportadoraPropriaChange = (checked: boolean) => {
    onDadosChange({
      ...dados,
      usar_transportadora_propria: checked,
      transportadora_id: checked ? undefined : dados.transportadora_id
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
    
    // Se peso líquido muda, recalcular peso bruto
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

  const transportadoraSelecionada = transportadoras.find(t => t.id === dados.transportadora_id)
  const showTransportadoraSelector = 
    (dados.modalidade_frete === '0' && !dados.usar_transportadora_propria) ||
    dados.modalidade_frete === '2'

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
          <Label>Modalidade de Frete</Label>
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

        {/* Toggle transportadora própria - apenas quando modalidade = 0 (Emitente) */}
        {dados.modalidade_frete === '0' && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="transportadora-propria" className="font-normal cursor-pointer">
                Usar transportadora própria (mesmo CNPJ da empresa)
              </Label>
            </div>
            <Switch
              id="transportadora-propria"
              checked={dados.usar_transportadora_propria ?? true}
              onCheckedChange={handleTransportadoraPropriaChange}
            />
          </div>
        )}

        {/* Info quando usar transportadora própria */}
        {dados.modalidade_frete === '0' && dados.usar_transportadora_propria && selectedCliente && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm">
              <span className="font-medium">Transportadora:</span> {selectedCliente.razao_social}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">CNPJ:</span> {selectedCliente.cpf_cnpj}
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

        {/* Volumes e Peso */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Volumes e Peso</span>
            <span className="text-xs text-muted-foreground ml-auto">(calculado automaticamente dos itens)</span>
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
            <span className="text-xs text-muted-foreground ml-auto">(calculado no simulador de frete abaixo)</span>
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
                className="bg-muted/30"
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