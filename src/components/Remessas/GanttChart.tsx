import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, parseISO, differenceInDays, startOfDay, endOfDay, startOfWeek, startOfMonth, getISOWeek, isWithinInterval, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, ArrowUpDown } from 'lucide-react';
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
type SortOrder = 'asc' | 'desc';

// Constantes para controle de altura das barras
const BAR_HEIGHT = 60; // Altura fixa de cada barra em pixels
const MIN_CHART_HEIGHT = 300; // Altura mínima do gráfico

const GanttChart: React.FC<GanttChartProps> = ({
  remessas,
  selectedRemessas = [],
  onToggleSelection
}) => {
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('dias');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Função para obter a data base para todos os cálculos (sempre usa a data mínima)
  const getBaseDate = (): Date => {
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

  // Aplicar ordenação aos dados do gráfico
  const ganttData = prepareGanttData().sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.start - b.start;
    } else {
      return b.start - a.start;
    }
  });

  // Calcular altura dinâmica do gráfico baseado no número de remessas
  const chartHeight = Math.max(MIN_CHART_HEIGHT, ganttData.length * BAR_HEIGHT);

  // Calcular o range completo do eixo X baseado em calendário fixo (6 meses antes, 12 meses depois de hoje)
  const getFullXAxisDomain = (): [number, number] => {
    try {
      const today = new Date();
      const baseDate = getBaseDate();

      // Definir range: 6 meses antes de hoje e 12 meses depois
      const startRange = addMonths(today, -6);
      const endRange = addMonths(today, 12);
      if (timeUnit === 'semanas') {
        const startWeek = startOfWeek(startRange, {
          locale: ptBR
        });
        const endWeek = startOfWeek(endRange, {
          locale: ptBR
        });
        const minPos = Math.floor(differenceInDays(startWeek, baseDate) / 7);
        const maxPos = Math.floor(differenceInDays(endWeek, baseDate) / 7);
        return [minPos, maxPos];
      } else if (timeUnit === 'meses') {
        const startMonth = startOfMonth(startRange);
        const endMonth = startOfMonth(endRange);
        const minPos = (startMonth.getFullYear() - baseDate.getFullYear()) * 12 + (startMonth.getMonth() - baseDate.getMonth());
        const maxPos = (endMonth.getFullYear() - baseDate.getFullYear()) * 12 + (endMonth.getMonth() - baseDate.getMonth());
        return [minPos, maxPos];
      } else {
        // dias
        const minPos = differenceInDays(startOfDay(startRange), baseDate);
        const maxPos = differenceInDays(startOfDay(endRange), baseDate);
        return [minPos, maxPos];
      }
    } catch {
      return [0, 365]; // Fallback: 1 ano
    }
  };

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

  // Calcular largura dinâmica do gráfico baseado no timeUnit e no domínio
  const calculateChartWidth = (): number => {
    const domain = getFullXAxisDomain();
    const domainRange = domain[1] - domain[0];
    switch (timeUnit) {
      case 'dias':
        // 45 pixels por dia para boa legibilidade
        return domainRange * 45;
      case 'semanas':
        // 70 pixels por semana
        return domainRange * 70;
      case 'meses':
        // 180 pixels por mês
        return domainRange * 180;
      default:
        return 2000;
    }
  };

  // Auto-scroll para centralizar em "hoje" ao montar o componente
  const scrollToToday = () => {
    setTimeout(() => {
      if (chartContainerRef.current && ganttData.length > 0) {
        const todayPos = getTodayPosition();
        if (todayPos !== null) {
          const container = chartContainerRef.current;
          const domain = getFullXAxisDomain();
          const domainRange = domain[1] - domain[0];

          // Calcular a posição em pixels baseado na proporção
          const scrollWidth = container.scrollWidth;
          const containerWidth = container.clientWidth;

          // Normalizar todayPos em relação ao domain
          const normalizedPos = (todayPos - domain[0]) / domainRange;
          const scrollPosition = normalizedPos * scrollWidth - containerWidth / 2;
          container.scrollLeft = Math.max(0, scrollPosition);
        }
      }
    }, 100);
  };

  // Executar auto-scroll quando os dados mudarem ou a unidade de tempo mudar
  useEffect(() => {
    scrollToToday();
  }, [ganttData.length, timeUnit]);

  // Função para obter cor baseada no status
  const getBarColor = (status: string, isSelected: boolean) => {
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
            As remessas expedidas ainda não possuem janelas de entrega definidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Configure as janelas de entrega para visualizar o cronograma
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Cronograma de Entregas</CardTitle>
              <CardDescription>
                Visualização das janelas de entrega das remessas expedidas
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={scrollToToday} className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Voltar para Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'asc' ? 'Mais próximas primeiro' : 'Mais distantes primeiro'}
              </Button>
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
        <div className="flex w-full max-h-[600px]">
          {/* Coluna fixa de remessas */}
          {onToggleSelection && <div className="w-32 flex-shrink-0 border-r border-border overflow-y-auto">
              <div className="text-sm font-medium text-muted-foreground mb-2 px-2 py-1 bg-background sticky top-0 z-10">
                Remessas
              </div>
              <div className="flex flex-col">
                {ganttData.map(item => <div key={item.id} className="flex items-center gap-2 px-2" style={{
              height: `${BAR_HEIGHT}px`
            }}>
                    <Checkbox checked={item.isSelected} onCheckedChange={() => onToggleSelection(item.id)} />
                    <span className="text-xs">{item.name}</span>
                  </div>)}
              </div>
            </div>}
          
          {/* Container com scroll horizontal - só o gráfico */}
          <div className="flex-1 overflow-x-auto overflow-y-auto" ref={chartContainerRef}>
            <div style={{
            height: `${chartHeight}px`,
            width: `${calculateChartWidth()}px`
          }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ganttData} layout="vertical" margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" orientation="top" domain={getFullXAxisDomain()} tickFormatter={formatXAxisTick} tickCount={timeUnit === 'dias' ? 30 : timeUnit === 'semanas' ? 20 : 12} tick={{
                  fontSize: 12
                }} />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Linha indicando hoje */}
                  {todayPosition !== null && <ReferenceLine x={todayPosition} stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="4 4" label={{
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
          </div>
        </div>
        
        {/* Legenda */}
        
      </CardContent>
    </Card>;
};
export default GanttChart;