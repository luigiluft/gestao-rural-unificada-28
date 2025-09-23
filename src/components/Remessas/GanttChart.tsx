import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RemessaData {
  id: string;
  data_inicio_janela: string;
  data_fim_janela: string;
  status: string;
}

interface GanttChartProps {
  remessas: RemessaData[];
}

interface GanttDataPoint {
  name: string;
  start: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
}

const GanttChart: React.FC<GanttChartProps> = ({ remessas }) => {
  // Preparar dados para o gráfico
  const prepareGanttData = (): GanttDataPoint[] => {
    if (!remessas.length) return [];

    // Filtrar remessas com datas válidas
    const remessasValidas = remessas.filter(r => {
      if (!r.data_inicio_janela || !r.data_fim_janela) return false;
      
      try {
        const startDate = parseISO(r.data_inicio_janela);
        const endDate = parseISO(r.data_fim_janela);
        
        // Verificar se as datas são válidas
        return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate;
      } catch (error) {
        console.warn('Data inválida encontrada:', r);
        return false;
      }
    });

    if (!remessasValidas.length) return [];

    // Encontrar as datas mínima e máxima para definir o range
    const allDates = remessasValidas.flatMap(r => {
      try {
        return [parseISO(r.data_inicio_janela), parseISO(r.data_fim_janela)];
      } catch (error) {
        return [];
      }
    }).filter(date => !isNaN(date.getTime()));
    
    if (!allDates.length) return [];
    
    const minDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    
    return remessasValidas.map((remessa, index) => {
      try {
        const startDate = parseISO(remessa.data_inicio_janela);
        const endDate = parseISO(remessa.data_fim_janela);
        
        // Calcular posição inicial em dias desde a data mínima
        const start = differenceInDays(startOfDay(startDate), minDate);
        
        // Calcular duração em dias
        const duration = differenceInDays(endOfDay(endDate), startOfDay(startDate)) + 1;
        
        // Garantir que os valores são números válidos
        const validStart = isNaN(start) ? 0 : Math.max(0, start);
        const validDuration = isNaN(duration) ? 1 : Math.max(1, duration);
        
        return {
          name: `#${remessa.id.slice(0, 8)}`,
          start: validStart,
          duration: validDuration,
          startDate: format(startDate, 'dd/MM/yyyy', { locale: ptBR }),
          endDate: format(endDate, 'dd/MM/yyyy', { locale: ptBR }),
          status: remessa.status
        };
      } catch (error) {
        console.warn('Erro ao processar remessa:', remessa, error);
        // Retornar dados padrão em caso de erro
        return {
          name: `#${remessa.id.slice(0, 8)}`,
          start: 0,
          duration: 1,
          startDate: 'Data inválida',
          endDate: 'Data inválida',
          status: remessa.status
        };
      }
    }).filter(item => !isNaN(item.start) && !isNaN(item.duration));
  };

  const ganttData = prepareGanttData();

  // Função para obter cor baseada no status
  const getBarColor = (status: string) => {
    switch (status) {
      case 'expedido':
        return 'hsl(var(--primary))';
      case 'entregue':
        return 'hsl(var(--success))';
      default:
        return 'hsl(var(--muted))';
    }
  };

  // Componente customizado de tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Remessa: ${label}`}</p>
          <p className="text-sm text-muted-foreground">{`Início: ${data.startDate}`}</p>
          <p className="text-sm text-muted-foreground">{`Fim: ${data.endDate}`}</p>
          <p className="text-sm text-muted-foreground">{`Duração: ${data.duration} dias`}</p>
          <p className="text-sm text-muted-foreground">{`Status: ${data.status}`}</p>
        </div>
      );
    }
    return null;
  };

  // Função para formatar os ticks do eixo X (dias)
  const formatXAxisTick = (value: number) => {
    if (ganttData.length === 0 || isNaN(value)) return '';
    
    try {
      // Encontrar a data mínima novamente para calcular a data do tick
      const remessasValidas = remessas.filter(r => r.data_inicio_janela && r.data_fim_janela);
      if (!remessasValidas.length) return '';
      
      const allDates = remessasValidas.flatMap(r => {
        try {
          return [parseISO(r.data_inicio_janela), parseISO(r.data_fim_janela)];
        } catch {
          return [];
        }
      }).filter(date => !isNaN(date.getTime()));
      
      if (!allDates.length) return '';
      
      const minDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
      
      const tickDate = new Date(minDate);
      tickDate.setDate(tickDate.getDate() + value);
      
      return format(tickDate, 'dd/MM', { locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  if (!remessas.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Entregas</CardTitle>
          <CardDescription>
            Visualização das janelas de entrega das remessas expedidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhuma remessa disponível para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma de Entregas</CardTitle>
        <CardDescription>
          Visualização das janelas de entrega das remessas expedidas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ganttData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                domain={[0, (dataMax: number) => Math.max(dataMax + 2, 1)]}
                tickFormatter={formatXAxisTick}
                tick={{ fontSize: 12 }}
                label={{ value: 'Período (dias)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={90}
                tick={{ fontSize: 12 }}
                label={{ value: 'Remessas', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Barra invisível para posicionar o início */}
              <Bar 
                dataKey="start" 
                stackId="gantt"
                fill="transparent"
              />
              
              {/* Barra colorida para a duração */}
              <Bar 
                dataKey="duration" 
                stackId="gantt"
                radius={[2, 2, 2, 2]}
              >
                {ganttData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            />
            <span className="text-sm text-muted-foreground">Expedido</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: 'hsl(var(--success))' }}
            />
            <span className="text-sm text-muted-foreground">Entregue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;