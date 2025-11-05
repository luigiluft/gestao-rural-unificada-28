import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DadosSaida } from "../types/formulario.types"
import { 
  getMinScheduleDateWithFreight, 
  isDateAfterTotalBusinessDays,
  calculateTotalBusinessDaysRequired 
} from "@/lib/business-days"
import { useDiasUteisExpedicao, useJanelaEntregaDias } from "@/hooks/useConfiguracoesSistema"
import { formatDeliveryWindowComplete, parseLocalDate } from "@/lib/delivery-window"
import { useHorariosDisponiveis } from "@/hooks/useReservasHorario"
import { useDisponibilidadePorData } from "@/hooks/useDisponibilidadePorData"
import { useState, useEffect } from "react"
import { addMonths, startOfMonth, endOfMonth } from "date-fns"

interface AgendamentoSectionProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
  pesoTotal: number
  pesoMinimoMopp: number
}

export function AgendamentoSection({ dados, onDadosChange, pesoTotal, pesoMinimoMopp }: AgendamentoSectionProps) {
  const diasUteisExpedicao = useDiasUteisExpedicao()
  const janelaEntregaDias = useJanelaEntregaDias()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  
  const requiredMopp = dados.tipo_saida === 'retirada_deposito' && pesoTotal >= pesoMinimoMopp
  const totalDias = calculateTotalBusinessDaysRequired(diasUteisExpedicao, dados.prazo_entrega_calculado)
  const minDateString = getMinScheduleDateWithFreight(diasUteisExpedicao, dados.prazo_entrega_calculado)
  const minDate = new Date(minDateString)

  // Calcular range de datas para o calendário (mês atual + próximo mês)
  const calendarStart = startOfMonth(new Date())
  const calendarEnd = endOfMonth(addMonths(new Date(), 1))
  
  // Hook para disponibilidade por data (só para retirada no depósito)
  const { data: disponibilidadePorData = {} } = useDisponibilidadePorData(
    calendarStart,
    calendarEnd,
    dados.tipo_saida === 'retirada_deposito' ? dados.depositoId : undefined
  )

  // Preparar modifiers para o calendário
  const datesHigh: Date[] = []
  const datesMedium: Date[] = []
  const datesLow: Date[] = []

  Object.entries(disponibilidadePorData).forEach(([dateString, nivel]) => {
    // Parse correto da data (yyyy-MM-dd) para Date local
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    if (nivel === 'high') datesHigh.push(date)
    else if (nivel === 'medium') datesMedium.push(date)
    else if (nivel === 'low') datesLow.push(date)
  })

  const modifiers = {
    high: datesHigh,
    medium: datesMedium,
    low: datesLow,
  }

  const modifiersClassNames = {
    high: 'rdp-day_high',
    medium: 'rdp-day_medium',
    low: 'rdp-day_low',
  }

// Ajuste automático da data: define a mínima quando vazio ou anterior ao mínimo
useEffect(() => {
  if (!dados.tipo_saida) return
  const current = dados.data_saida ? new Date(dados.data_saida + 'T00:00:00') : undefined
  if (!dados.data_saida || (current && current < minDate)) {
    const updatedDados = {
      ...dados,
      data_saida: minDateString,
      janela_entrega_dias: janelaEntregaDias,
    }
    onDadosChange(updatedDados)
  }
}, [dados.data_saida, dados.tipo_saida, minDateString])

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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd')
      handleChange('data_saida', dateString)
      setIsCalendarOpen(false)
    }
  }

  const selectedDate = dados.data_saida ? new Date(dados.data_saida + 'T00:00:00') : undefined

  // Não mostrar se não há prazo calculado para entrega na fazenda
  if (dados.tipo_saida === 'entrega_fazenda' && !dados.prazo_entrega_calculado) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendamento da {dados.tipo_saida === 'retirada_deposito' ? 'Retirada' : 'Entrega'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {dados.tipo_saida === 'retirada_deposito' 
            ? 'Agende a retirada no depósito' 
            : 'Confirme a data de entrega na fazenda'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data_agendamento">Data de {dados.tipo_saida === 'retirada_deposito' ? 'Retirada' : 'Entrega'} *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="space-y-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < minDate}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  
                  {/* Legenda de disponibilidade - só mostrar para retirada no depósito */}
                  {dados.tipo_saida === 'retirada_deposito' && (
                    <div className="px-3 pb-3 border-t pt-3">
                      <p className="text-xs font-medium mb-2">Disponibilidade de horários:</p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                          <span className="text-xs">Alta disponibilidade (60%+)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                          <span className="text-xs">Média disponibilidade (30-59%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                          <span className="text-xs">Baixa disponibilidade (&lt;30%)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
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
                    Mínimo: {totalDias} dias úteis
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
                Mínimo: {totalDias} dias úteis
                {dados.prazo_entrega_calculado ? 
                  ` (${diasUteisExpedicao} config + ${dados.prazo_entrega_calculado} frete)` : 
                  ''
                }
              </p>
            )}
          </div>

          {/* Horário apenas para retirada no depósito */}
          {dados.tipo_saida === 'retirada_deposito' && dados.data_saida && (
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
          )}
        </div>

        {/* Dados do transporte para retirada no depósito */}
        {dados.tipo_saida === 'retirada_deposito' && dados.data_saida && (
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}