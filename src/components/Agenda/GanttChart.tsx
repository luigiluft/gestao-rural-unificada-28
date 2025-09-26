import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GanttItem } from "@/hooks/useGanttData"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface GanttChartProps {
  data: GanttItem[]
  selectedDate?: Date
}

export const GanttChart = ({ data, selectedDate }: GanttChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cronograma de Entregas
          </CardTitle>
          <CardDescription>
            Visualização das janelas de entrega vs datas programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Nenhuma entrega encontrada para o período selecionado
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate date range for the week view
  const baseDate = selectedDate || new Date()
  const weekStart = startOfWeek(baseDate, { locale: ptBR })
  const weekEnd = endOfWeek(baseDate, { locale: ptBR })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return 'bg-yellow-500'
      case 'separado':
        return 'bg-blue-500'
      case 'expedido':
        return 'bg-purple-500'
      case 'entregue':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
        return <CheckCircle className="h-3 w-3" />
      case 'expedido':
        return <Clock className="h-3 w-3" />
      default:
        return <AlertTriangle className="h-3 w-3" />
    }
  }

  const getDivergenceColor = (dias: number) => {
    if (dias === 0) return 'text-green-600'
    if (dias > 0) return 'text-red-600'
    return 'text-blue-600'
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cronograma de Entregas
          </CardTitle>
          <CardDescription>
            Comparação entre janelas ideais (barras) e datas programadas (marcadores)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header with dates */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Entregas
              </div>
              {weekDays.map(day => (
                <div key={day.toISOString()} className="text-center">
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-sm font-medium">
                    {format(day, 'dd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Gantt rows */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.map((item, index) => {
                const dataInicioTime = item.data_inicio_janela.getTime()
                const dataFimTime = item.data_fim_janela.getTime()
                const weekStartTime = weekStart.getTime()
                const weekEndTime = weekEnd.getTime()
                
                // Check if delivery window intersects with current week
                const hasIntersection = dataInicioTime <= weekEndTime && dataFimTime >= weekStartTime
                
                if (!hasIntersection) return null

                return (
                  <div key={item.saida_id} className="grid grid-cols-8 gap-2 items-center py-2 border-b border-border/50">
                    {/* Row label */}
                    <div className="text-sm">
                      <div className="font-medium truncate">
                        {item.pedido_numero}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.cliente_nome}
                      </div>
                    </div>

                    {/* Timeline cells */}
                    {weekDays.map(day => {
                      const dayTime = day.getTime()
                      const dayStr = format(day, 'yyyy-MM-dd')
                      const inicioJanelaStr = format(item.data_inicio_janela, 'yyyy-MM-dd')
                      const fimJanelaStr = format(item.data_fim_janela, 'yyyy-MM-dd')
                      
                      // Check if this day is within the delivery window
                      const isWithinWindow = dayStr >= inicioJanelaStr && dayStr <= fimJanelaStr
                      const isStartOfWindow = dayStr === inicioJanelaStr
                      const isEndOfWindow = dayStr === fimJanelaStr
                      const isRealDay = item.data_real && format(day, 'yyyy-MM-dd') === format(item.data_real, 'yyyy-MM-dd')
                      
                      return (
                        <div key={day.toISOString()} className="relative h-8 flex items-center justify-center">
                          {/* Delivery window bar */}
                          {isWithinWindow && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`w-full h-4 ${getStatusColor(item.status)} opacity-60 flex items-center justify-center 
                                  ${isStartOfWindow ? 'rounded-l' : ''} 
                                  ${isEndOfWindow ? 'rounded-r' : ''}
                                  ${isStartOfWindow && isEndOfWindow ? 'rounded' : ''}`}>
                                  {isStartOfWindow && getStatusIcon(item.status)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-medium">{item.pedido_numero}</div>
                                  <div className="text-sm">Cliente: {item.cliente_nome}</div>
                                  <div className="text-sm">
                                    Janela: {format(item.data_inicio_janela, 'dd/MM')} a {format(item.data_fim_janela, 'dd/MM')} 
                                    ({item.janela_entrega_dias} dias)
                                  </div>
                                  {item.janela_horario && (
                                    <div className="text-sm">Horário: {item.janela_horario}</div>
                                  )}
                                  <div className="text-sm">Status: {item.status}</div>
                                  <div className="text-sm">Produto: {item.produto_descricao}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Real transport date marker */}
                          {isRealDay && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute top-0 right-0 z-10">
                                  {item.divergencia_dias === 0 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 bg-background rounded-full" />
                                  ) : item.divergencia_dias > 0 ? (
                                    <XCircle className="h-4 w-4 text-red-600 bg-background rounded-full" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-blue-600 bg-background rounded-full" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-medium">Data Programada</div>
                                  <div className="text-sm">Viagem: {format(item.data_real!, 'dd/MM/yyyy')}</div>
                                  <div className={`text-sm font-medium ${getDivergenceColor(item.divergencia_dias)}`}>
                                    {item.divergencia_dias === 0 && 'Dentro da janela ✓'}
                                    {item.divergencia_dias > 0 && `${item.divergencia_dias} dia(s) após janela`}
                                    {item.divergencia_dias < 0 && `${Math.abs(item.divergencia_dias)} dia(s) antes da janela`}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-sm font-medium mb-2">Legenda:</div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 opacity-60 rounded"></div>
                  <span>Janela de Entrega</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Viagem Dentro da Janela</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Viagem Fora da Janela (Atrasada)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Viagem Antecipada</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}