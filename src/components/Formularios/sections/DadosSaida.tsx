import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DadosSaida } from "../types/formulario.types"

import { useProfile, useProdutoresComEstoqueNaFranquia, useFazendas } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useState, useEffect } from "react"
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
import { useMemo } from "react"

interface DadosSaidaProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
  pesoTotal: number
  pesoMinimoMopp: number
}

export function DadosSaidaSection({ dados, onDadosChange, pesoTotal, pesoMinimoMopp }: DadosSaidaProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: produtoresComEstoque } = useProdutoresComEstoqueNaFranquia()
  const diasUteisExpedicao = useDiasUteisExpedicao()
  const horariosRetirada = useHorariosRetirada()
  const janelaEntregaDias = useJanelaEntregaDias()
  const [franquiaCoords, setFranquiaCoords] = useState<Coordinates | null>(null)
  const [fazendaCoords, setFazendaCoords] = useState<Coordinates | null>(null)
  const [franquiaNome, setFranquiaNome] = useState<string>('')

  // Hooks condicionais baseados no papel do usuário
  const { data: depositosProdutor = [] } = useDepositosDisponiveis(
    profile?.role === 'produtor' ? user?.id : undefined
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
    } else if (profile?.role === 'franqueado') {
      return franquiasFranqueado.map(franquia => ({
        deposito_id: franquia.id,
        deposito_nome: franquia.nome,
        franqueado_nome: franquia.nome
      }))
    } else if (profile?.role === 'produtor') {
      return depositosProdutor || []
    }
    return []
  }, [profile?.role, todasFranquias, franquiasFranqueado, depositosProdutor])

  const isProdutor = profile?.role === 'produtor'
  const isFranqueado = profile?.role === 'franqueado'
  const requiredMopp = dados.tipo_saida === 'retirada_deposito' && pesoTotal >= pesoMinimoMopp

  // Get the target producer ID for farms
  const targetProdutorId = isProdutor ? user?.id : dados.produtor_destinatario
  const { data: fazendas = [], isLoading: loadingFazendas } = useFazendas(targetProdutorId)

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
      frete_origem: franquiaNome,
      frete_destino: fazendas.find(f => f.id === dados.fazenda_id)?.nome || '',
      frete_distancia: resultado.faixa_aplicada ? 
        (Number(resultado.faixa_aplicada.distancia_min) + Number(resultado.faixa_aplicada.distancia_max)) / 2 : 
        undefined
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data_saida">Data de Entrega *</Label>
            <Input
              id="data_saida"
              type="date"
              value={dados.data_saida}
              min={getMinScheduleDateWithFreight(diasUteisExpedicao, dados.prazo_entrega_calculado)}
              onChange={(e) => handleChange('data_saida', e.target.value)}
            />
            {dados.data_saida && (
              <div className="space-y-1">
                <p className="text-xs text-primary font-medium">
                  Janela: {formatDeliveryWindowComplete(parseLocalDate(dados.data_saida), janelaEntregaDias)}
                </p>
                {!isDateAfterTotalBusinessDays(
                  parseLocalDate(dados.data_saida), 
                  diasUteisExpedicao, 
                  dados.prazo_entrega_calculado
                ) && (
                  <p className="text-xs text-destructive">
                    Mínimo: {calculateTotalBusinessDaysRequired(diasUteisExpedicao, dados.prazo_entrega_calculado)} dias úteis
                    {dados.prazo_entrega_calculado ? 
                      ` (${diasUteisExpedicao} config + ${dados.prazo_entrega_calculado} frete)` : 
                      ''
                    }
                  </p>
                )}
              </div>
            )}
            {!dados.data_saida && (
              <p className="text-xs text-muted-foreground">
                Mínimo: {calculateTotalBusinessDaysRequired(diasUteisExpedicao, dados.prazo_entrega_calculado)} dias úteis
                {dados.prazo_entrega_calculado ? 
                  ` (${diasUteisExpedicao} config + ${dados.prazo_entrega_calculado} frete)` : 
                  ''
                }
              </p>
            )}
          </div>

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

          {/* Só mostrar seleção de produtor para franqueados */}
          {isFranqueado && (
            <div className="space-y-2">
              <Label htmlFor="produtor_destinatario">Produtor Destinatário *</Label>
              <Select value={dados.produtor_destinatario} onValueChange={(value) => handleChange('produtor_destinatario', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produtor" />
                </SelectTrigger>
                <SelectContent>
                  {produtoresComEstoque?.map((produtor) => (
                    <SelectItem key={produtor.user_id} value={produtor.user_id}>
                      {produtor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mostrar seleção de fazenda quando há produtor selecionado */}
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

        {/* Seção de transporte para retirada no depósito */}
        {dados.tipo_saida === 'retirada_deposito' && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Dados do Transporte</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placa_veiculo">Placa do Veículo *</Label>
                <Input
                  id="placa_veiculo"
                  value={dados.placa_veiculo}
                  onChange={(e) => handleChange('placa_veiculo', e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_motorista">Nome do Motorista *</Label>
                <Input
                  id="nome_motorista"
                  value={dados.nome_motorista}
                  onChange={(e) => handleChange('nome_motorista', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone_motorista">Telefone do Motorista *</Label>
                <Input
                  id="telefone_motorista"
                  value={dados.telefone_motorista}
                  onChange={(e) => handleChange('telefone_motorista', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_motorista">CPF do Motorista</Label>
                <Input
                  id="cpf_motorista"
                  value={dados.cpf_motorista}
                  onChange={(e) => handleChange('cpf_motorista', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              {requiredMopp && (
                <div className="space-y-2">
                  <Label htmlFor="mopp_motorista">MOPP do Motorista *</Label>
                  <Input
                    id="mopp_motorista"
                    value={dados.mopp_motorista}
                    onChange={(e) => handleChange('mopp_motorista', e.target.value)}
                    placeholder="Número do MOPP"
                  />
                  <p className="text-xs text-amber-600">
                    MOPP obrigatório para cargas acima de {pesoMinimoMopp} Kg/L
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="janela_horario">Janela de Horário *</Label>
                <Select value={dados.janela_horario} onValueChange={(value) => handleChange('janela_horario', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponiveis.map((horario) => (
                      <SelectItem key={horario} value={horario}>
                        {horario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {horariosDisponiveis.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Nenhum horário disponível para esta data
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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