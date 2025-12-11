import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DadosSaida } from "../types/formulario.types"

import { useProfile, useFazendas } from "@/hooks/useProfile"
import { useClientesParaSaida } from "@/hooks/useClientesParaSaida"
import { ClienteDestinatarioSelector } from "../components/ClienteDestinatarioSelector"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useState, useEffect, useMemo } from "react"
import type { Coordinates } from "@/services/routingService"
import { 
  getMinScheduleDateWithFreight, 
  isDateAfterTotalBusinessDays,
  calculateTotalBusinessDaysRequired 
} from "@/lib/business-days"
import { useDiasUteisExpedicao, useHorariosRetirada, useJanelaEntregaDias } from "@/hooks/useConfiguracoesSistema"
import { formatDeliveryWindowComplete, parseLocalDate } from "@/lib/delivery-window"
import { useHorariosDisponiveis } from "@/hooks/useReservasHorario"
import { useDepositosDisponiveis, useDepositosFranqueado, useTodasFranquias } from "@/hooks/useDepositosDisponiveis"

interface DadosSaidaProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
  pesoTotal: number
  pesoMinimoMopp: number
}

export function DadosSaidaSection({ dados, onDadosChange, pesoTotal, pesoMinimoMopp }: DadosSaidaProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: clientesParaSaida = [] } = useClientesParaSaida()
  const diasUteisExpedicao = useDiasUteisExpedicao()
  const horariosRetirada = useHorariosRetirada()
  const janelaEntregaDias = useJanelaEntregaDias()
  const [franquiaCoords, setFranquiaCoords] = useState<Coordinates | null>(null)
  const [fazendaCoords, setFazendaCoords] = useState<Coordinates | null>(null)
  const [franquiaNome, setFranquiaNome] = useState<string>('')

  // Hooks condicionais baseados no papel do usuário
  const { data: depositosProdutor = [] } = useDepositosDisponiveis(
    profile?.role === 'cliente' ? user?.id : undefined
  )
  const { data: franquiasFranqueado = [] } = useDepositosFranqueado()
  const { data: todasFranquias = [] } = useTodasFranquias()

  // Normalizar dados para formato consistente
  const depositos = useMemo(() => {
    if (profile?.role === 'admin') {
      return todasFranquias.map(franquia => ({
        deposito_id: franquia.id,
        deposito_nome: franquia.nome,
        franqueado_nome: 'Admin'
      }))
    } else if (franquiasFranqueado && franquiasFranqueado.length > 0) {
      // User has franchise access
      return franquiasFranqueado.map(franquia => ({
        deposito_id: franquia.id,
        deposito_nome: franquia.nome,
        franqueado_nome: franquia.nome
      }))
    } else if (profile?.role === 'cliente') {
      return depositosProdutor || []
    }
    return []
  }, [profile?.role, todasFranquias, franquiasFranqueado, depositosProdutor])

  const isCliente = profile?.role === 'cliente'
  const hasFranchiseAccess = franquiasFranqueado && franquiasFranqueado.length > 0
  const requiredMopp = dados.tipo_saida === 'retirada_deposito' && pesoTotal >= pesoMinimoMopp

  // Get the target producer ID for farms
  const targetClienteId = isCliente ? user?.id : dados.produtor_destinatario
  const { data: fazendas = [], isLoading: loadingFazendas } = useFazendas(targetClienteId)

  // Hook para horários disponíveis
  const { data: horariosDisponiveis = [] } = useHorariosDisponiveis(
    dados.data_saida,
    dados.tipo_saida === 'retirada_deposito' ? dados.depositoId : undefined
  )

  const handleChange = (campo: keyof DadosSaida, valor: string) => {
    const updatedDados = { ...dados, [campo]: valor }
    
    // Se mudou a data de saída, incluir a configuração de janela
    if (campo === 'data_saida') {
      updatedDados.janela_entrega_dias = janelaEntregaDias
    }
    
    onDadosChange(updatedDados)
  }

  // Buscar coordenadas da franquia do usuário logado
  useEffect(() => {
    const fetchFranquiaCoords = async () => {
      if (!user?.id) return

      try {
        const { data: franquia } = await supabase
          .from('franquias')
          .select('latitude, longitude, nome')
          .eq('master_franqueado_id', user.id)
          .maybeSingle()

        if (franquia?.latitude && franquia?.longitude) {
          setFranquiaCoords({
            latitude: Number(franquia.latitude),
            longitude: Number(franquia.longitude)
          })
          setFranquiaNome(franquia.nome)
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas da franquia:', error)
      }
    }

    fetchFranquiaCoords()
  }, [user?.id])

  // Buscar coordenadas da fazenda quando selecionada
  useEffect(() => {
    const fetchFazendaCoords = async () => {
      if (!dados.fazenda_id) {
        setFazendaCoords(null)
        return
      }

      try {
        const { data: fazenda } = await supabase
          .from('fazendas')
          .select('latitude, longitude, nome')
          .eq('id', dados.fazenda_id)
          .maybeSingle()

        if (fazenda?.latitude && fazenda?.longitude) {
          setFazendaCoords({
            latitude: Number(fazenda.latitude),
            longitude: Number(fazenda.longitude)
          })
        } else {
          setFazendaCoords(null)
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas da fazenda:', error)
        setFazendaCoords(null)
      }
    }

    fetchFazendaCoords()
  }, [dados.fazenda_id])

  const handleFreteCalculado = (resultado: any) => {
    const updatedDados = {
      ...dados,
      valor_frete_calculado: resultado.valor_total,
      prazo_entrega_calculado: resultado.prazo_entrega,
      frete_origem: resultado.origem || franquiaNome,
      frete_destino: resultado.destino || fazendas.find(f => f.id === dados.fazenda_id)?.nome || '',
      frete_distancia: resultado.distancia_km || undefined
    }
    onDadosChange(updatedDados)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Saída</CardTitle>
        <p className="text-sm text-muted-foreground">
          Informações gerais sobre a saída
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label htmlFor="deposito_id">Depósito *</Label>
            <Select value={dados.depositoId} onValueChange={(value) => handleChange('depositoId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                {depositos.map((deposito) => (
                  <SelectItem key={deposito.deposito_id} value={deposito.deposito_id}>
                    {deposito.deposito_nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de cliente destinatário para clientes (venda B2B) */}
          {isCliente && (
            <ClienteDestinatarioSelector
              value={dados.cliente_destinatario_id}
              onChange={(clienteId) => handleChange('cliente_destinatario_id', clienteId)}
            />
          )}

          {/* Só mostrar seleção de produtor para usuários com acesso a franquias */}
          {hasFranchiseAccess && (
            <div className="space-y-2">
              <Label htmlFor="produtor_destinatario">Produtor Destinatário *</Label>
              <Select value={dados.produtor_destinatario} onValueChange={(value) => handleChange('produtor_destinatario', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produtor" />
                </SelectTrigger>
                <SelectContent>
                  {clientesParaSaida?.map((cliente) => (
                    <SelectItem key={cliente.user_id} value={cliente.user_id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

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