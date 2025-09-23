import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, parseISO, differenceInDays, startOfDay, endOfDay, startOfWeek, startOfMonth, getISOWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
interface RemessaData {
  id: string;
  data_inicio_janela: string;
  data_fim_janela: string;
  status: string;
}
interface GanttChartProps {
  remessas: RemessaData[];
  selectedRemessas?: string[];
  onToggleSelection?: (remessaId: string) => void;
}
interface GanttDataPoint {
  name: string;
  id: string;
  start: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
  isSelected: boolean;
}
type TimeUnit = 'dias' | 'semanas' | 'meses';
const GanttChart: React.FC<GanttChartProps> = ({
  remessas,
  selectedRemessas = [],
  onToggleSelection
}) => {
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('dias');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Função para obter a data base para todos os cálculos
  const getBaseDate = (): Date => {
    // Se há filtro de data, usar a data de início do filtro como base
    if (startDate) {
      if (timeUnit === 'semanas') {
        return startOfWeek(startDate, {
          locale: ptBR
        });
      } else if (timeUnit === 'meses') {
        return startOfMonth(startDate);
      } else {
        return startOfDay(startDate);
      }
    }

    // Senão, usar a data mínima dos dados
    const remessasValidas = remessas.filter(r => r.data_inicio_janela && r.data_fim_janela);
    if (!remessasValidas.length) return new Date();
    const allDates = remessasValidas.flatMap(r => {
      try {
        const startDate = new Date(r.data_inicio_janela + 'T00:00:00');
        const endDate = new Date(r.data_fim_janela + 'T23:59:59');
        return [startDate, endDate];
      } catch (error) {
        return [];
      }
    }).filter(date => !isNaN(date.getTime()));
    if (!allDates.length) return new Date();
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    if (timeUnit === 'semanas') {
      return startOfWeek(minDate, {
        locale: ptBR
      });
    } else if (timeUnit === 'meses') {
      return startOfMonth(minDate);
    } else {
      return startOfDay(minDate);
    }
  };

  // Preparar dados para o gráfico (usando todas as remessas)
  const prepareGanttData = (): GanttDataPoint[] => {
    if (!remessas.length) return [];

    // Filtrar remessas com datas válidas
    const remessasValidas = remessas.filter(r => {
      if (!r.data_inicio_janela || !r.data_fim_janela) return false;
      try {
        const startDate = new Date(r.data_inicio_janela + 'T00:00:00');
        const endDate = new Date(r.data_fim_janela + 'T23:59:59');
        return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate;
      } catch (error) {
        return false;
      }
    });
    if (!remessasValidas.length) return [];
    const baseDate = getBaseDate();
    return remessasValidas.map(remessa => {
      try {
        const startDate = new Date(remessa.data_inicio_janela + 'T00:00:00');
        const endDate = new Date(remessa.data_fim_janela + 'T23:59:59');
        let start: number;
        let duration: number;
        if (timeUnit === 'semanas') {
          const startWeek = startOfWeek(startDate, {
            locale: ptBR
          });
          const endWeek = startOfWeek(endDate, {
            locale: ptBR
          });
          start = Math.floor(differenceInDays(startWeek, baseDate) / 7);
          duration = Math.max(1, Math.floor(differenceInDays(endWeek, startWeek) / 7) + 1);
        } else if (timeUnit === 'meses') {
          const startMonth = startOfMonth(startDate);
          const endMonth = startOfMonth(endDate);
          start = (startMonth.getFullYear() - baseDate.getFullYear()) * 12 + (startMonth.getMonth() - baseDate.getMonth());
          duration = Math.max(1, (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1);
        } else {
          start = differenceInDays(startOfDay(startDate), baseDate);
          duration = differenceInDays(endOfDay(endDate), startOfDay(startDate)) + 1;
        }
        return {
          name: `#${remessa.id.slice(0, 8)}`,
          id: remessa.id,
          start: Math.max(0, start),
          duration: Math.max(1, duration),
          startDate: format(startDate, 'dd/MM/yyyy', {
            locale: ptBR
          }),
          endDate: format(endDate, 'dd/MM/yyyy', {
            locale: ptBR
          }),
          status: remessa.status,
          isSelected: selectedRemessas.includes(remessa.id)
        };
      } catch (error) {
        return {
          name: `#${remessa.id.slice(0, 8)}`,
          id: remessa.id,
          start: 0,
          duration: 1,
          startDate: 'Data inválida',
          endDate: 'Data inválida',
          status: remessa.status,
          isSelected: selectedRemessas.includes(remessa.id)
        };
      }
    });
  };
  const ganttData = prepareGanttData();

  // Calcular posição da linha "hoje"
  const getTodayPosition = (): number | null => {
    if (!ganttData.length) return null;
    try {
      const today = new Date();
      const baseDate = getBaseDate();
      if (timeUnit === 'semanas') {
        const todayWeek = startOfWeek(today, {
          locale: ptBR
        });
        return Math.floor(differenceInDays(todayWeek, baseDate) / 7);
      } else if (timeUnit === 'meses') {
        const todayMonth = startOfMonth(today);
        return (todayMonth.getFullYear() - baseDate.getFullYear()) * 12 + (todayMonth.getMonth() - baseDate.getMonth());
      } else {
        return differenceInDays(startOfDay(today), baseDate);
      }
    } catch {
      return null;
    }
  };
  const todayPosition = getTodayPosition();

  // Função para obter cor baseada no status e seleção
  const getBarColor = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return 'hsl(var(--accent))';
    }
    switch (status) {
      case 'expedido':
        return 'hsl(var(--primary))';
      case 'entregue':
        return 'hsl(var(--success))';
      default:
        return 'hsl(var(--muted))';
    }
  };

  // Componente customizado de tooltip (sem botão de seleção)
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return <div className="bg-background border border-border rounded-lg p-4 shadow-lg min-w-[200px]">
          <p className="font-medium mb-2">{`Remessa: ${label}`}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{`Início: ${data.startDate}`}</p>
            <p className="text-sm text-muted-foreground">{`Fim: ${data.endDate}`}</p>
            <p className="text-sm text-muted-foreground">{`Duração: ${data.duration} dias`}</p>
            <p className="text-sm text-muted-foreground">{`Status: ${data.status}`}</p>
          </div>
        </div>;
    }
    return null;
  };

  // Função para formatar os ticks do eixo X baseado na unidade de tempo
  const formatXAxisTick = (value: number) => {
    if (ganttData.length === 0 || isNaN(value)) return '';
    try {
      const baseDate = getBaseDate();
      const tickDate = new Date(baseDate);
      if (timeUnit === 'semanas') {
        tickDate.setDate(tickDate.getDate() + value * 7);
        return `S${getISOWeek(tickDate)}`;
      } else if (timeUnit === 'meses') {
        tickDate.setMonth(tickDate.getMonth() + value);
        return format(tickDate, 'MMM/yy', {
          locale: ptBR
        });
      } else {
        tickDate.setDate(tickDate.getDate() + value);
        return format(tickDate, 'dd/MM', {
          locale: ptBR
        });
      }
    } catch (error) {
      return '';
    }
  };

  // Componente customizado para o eixo Y com checkboxes
  const CustomYAxisTick = (props: any) => {
    const {
      x,
      y,
      payload
    } = props;
    const remessaData = ganttData.find(item => item.name === payload.value);
    if (!remessaData) return null;
    return <g transform={`translate(${x},${y})`}>
        {onToggleSelection && <foreignObject x={-120} y={-10} width={20} height={20}>
            <Checkbox checked={remessaData.isSelected} onCheckedChange={() => onToggleSelection(remessaData.id)} className="pointer-events-auto" />
          </foreignObject>}
        <text x={onToggleSelection ? -95 : -10} y={0} dy={4} textAnchor="start" fill="currentColor" fontSize={12}>
          {payload.value}
        </text>
      </g>;
  };
  const getXAxisLabel = () => {
    switch (timeUnit) {
      case 'semanas':
        return 'Período (semanas)';
      case 'meses':
        return 'Período (meses)';
      default:
        return 'Período (dias)';
    }
  };
  if (!remessas.length) {
    return <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cronograma de Entregas</CardTitle>
              <CardDescription>
                Visualização das janelas de entrega das remessas expedidas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeUnit} onValueChange={(value: TimeUnit) => setTimeUnit(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="semanas">Semanas</SelectItem>
                  <SelectItem value="meses">Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhuma remessa disponível para exibir
          </div>
        </CardContent>
      </Card>;
  }
  if (ganttData.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>Cronograma de Entregas</CardTitle>
          <CardDescription>
            Não há remessas com janelas de entrega válidas para exibir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione ou corrija as datas de janela para visualizar o gráfico
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cronograma de Entregas</CardTitle>
                <CardDescription>
                  Visualização das janelas de entrega das remessas expedidas
                </CardDescription>
              </div>
              <Select value={timeUnit} onValueChange={(value: TimeUnit) => setTimeUnit(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="semanas">Semanas</SelectItem>
                  <SelectItem value="meses">Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtros de Data */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Período:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-40 justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                
                <span className="text-muted-foreground">até</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-40 justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                
                {(startDate || endDate) && <Button variant="ghost" size="sm" onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
            }}>
                    <X className="h-4 w-4" />
                  </Button>}
              </div>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="h-96">
          {/* Título "Remessas" acima do gráfico */}
          {onToggleSelection}
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ganttData} layout="vertical" margin={{
            top: 30,
            right: 30,
            left: onToggleSelection ? 130 : 100,
            bottom: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" orientation="top" domain={(() => {
              if (!startDate || !endDate) {
                return [0, (dataMax: number) => Math.max(dataMax + 2, 1)];
              }
              const baseDate = getBaseDate();
              let domainStart: number;
              let domainEnd: number;
              if (timeUnit === 'semanas') {
                const filterStartWeek = startOfWeek(startDate, {
                  locale: ptBR
                });
                const filterEndWeek = startOfWeek(endDate, {
                  locale: ptBR
                });
                domainStart = Math.floor(differenceInDays(filterStartWeek, baseDate) / 7);
                domainEnd = Math.floor(differenceInDays(filterEndWeek, baseDate) / 7) + 1;
              } else if (timeUnit === 'meses') {
                const filterStartMonth = startOfMonth(startDate);
                const filterEndMonth = startOfMonth(endDate);
                domainStart = (filterStartMonth.getFullYear() - baseDate.getFullYear()) * 12 + (filterStartMonth.getMonth() - baseDate.getMonth());
                domainEnd = (filterEndMonth.getFullYear() - baseDate.getFullYear()) * 12 + (filterEndMonth.getMonth() - baseDate.getMonth()) + 1;
              } else {
                domainStart = differenceInDays(startOfDay(startDate), baseDate);
                domainEnd = differenceInDays(endOfDay(endDate), baseDate) + 1;
              }
              return [domainStart, domainEnd];
            })()} tickFormatter={formatXAxisTick} tick={{
              fontSize: 12
            }} label={{
              value: getXAxisLabel(),
              position: 'insideTopLeft',
              offset: 10
            }} />
              <YAxis type="category" dataKey="name" width={onToggleSelection ? 130 : 90} tick={<CustomYAxisTick />} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Linha indicando hoje */}
              {todayPosition !== null && todayPosition >= 0 && <ReferenceLine x={todayPosition} stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="4 4" label={{
              value: "Hoje",
              position: "top",
              fill: "hsl(var(--destructive))"
            }} />}
              
              {/* Barra invisível para posicionar o início */}
              <Bar dataKey="start" stackId="gantt" fill="transparent" />
              
              {/* Barra colorida para a duração */}
              <Bar dataKey="duration" stackId="gantt" radius={[2, 2, 2, 2]}>
                {ganttData.map((entry, index) => <Cell key={`cell-${index}`} fill={getBarColor(entry.status, entry.isSelected)} stroke={entry.isSelected ? "hsl(var(--accent-foreground))" : "transparent"} strokeWidth={entry.isSelected ? 2 : 0} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{
            backgroundColor: 'hsl(var(--primary))'
          }} />
            <span className="text-sm text-muted-foreground">Expedido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{
            backgroundColor: 'hsl(var(--success))'
          }} />
            <span className="text-sm text-muted-foreground">Entregue</span>
          </div>
          {onToggleSelection && <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{
            backgroundColor: 'hsl(var(--accent))',
            borderColor: 'hsl(var(--accent-foreground))'
          }} />
              <span className="text-sm text-muted-foreground">Selecionada</span>
            </div>}
          {onToggleSelection && <div className="text-sm text-muted-foreground ml-auto">
              Use as caixas de seleção à esquerda para selecionar remessas
            </div>}
        </div>
      </CardContent>
    </Card>;
};
export default GanttChart;