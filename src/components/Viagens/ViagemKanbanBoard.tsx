import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Truck, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useUpdateViagemData } from '@/hooks/useUpdateViagemData';
import { format, addDays, subDays, isSameDay, differenceInCalendarDays, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface Viagem {
  id: string;
  numero: string;
  previsao_inicio: string; // Onde o card aparece no Kanban
  data_inicio?: string; // Quando motorista iniciou (opcional)
  data_fim?: string; // Quando foi concluído (opcional)
  status: string;
  observacoes?: string;
  progresso?: number;
}
interface ViagemKanbanBoardProps {
  viagens: Viagem[];
  onViagemSelect?: (viagem: Viagem) => void;
}
type ViewType = 'daily' | 'weekly' | 'monthly';
const statusBadges = {
  planejada: {
    label: 'Planejada',
    variant: 'secondary' as const,
    color: 'bg-blue-500'
  },
  em_andamento: {
    label: 'Em Andamento',
    variant: 'default' as const,
    color: 'bg-amber-500'
  },
  concluida: {
    label: 'Concluída',
    variant: 'outline' as const,
    color: 'bg-green-500'
  },
  cancelada: {
    label: 'Cancelada',
    variant: 'destructive' as const,
    color: 'bg-red-500'
  }
};
interface DroppableColumnProps {
  dateIndex: number;
  children: React.ReactNode;
}
const DroppableColumn: React.FC<DroppableColumnProps> = ({
  dateIndex,
  children
}) => {
  const {
    setNodeRef
  } = useDroppable({
    id: `droppable-${dateIndex}`
  });
  return <div ref={setNodeRef} className="flex-shrink-0 w-48 p-3 border-r min-h-96 bg-background hover:bg-muted/30 transition-colors">
      {children}
    </div>;
};
interface SortableViagemCardProps {
  viagem: Viagem;
  onClick?: () => void;
  dateIndex: number;
}
const SortableViagemCard: React.FC<SortableViagemCardProps> = ({
  viagem,
  onClick,
  dateIndex
}) => {
  // Desabilitar drag se a viagem está em andamento
  const isDragDisabled = viagem.status === 'em_andamento';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `${viagem.id}-${dateIndex}`,
    data: {
      viagem,
      dateIndex
    },
    disabled: isDragDisabled
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  };
  const statusConfig = statusBadges[viagem.status as keyof typeof statusBadges] || statusBadges.planejada;
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragDisabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}>
      <Card className={`mb-2 hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''} ${isDragDisabled ? 'opacity-90' : ''}`} onClick={onClick}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />
              <span className="font-medium text-sm">{viagem.numero}</span>
            </div>
            <Badge variant={statusConfig.variant} className="text-xs">
              {statusConfig.label}
            </Badge>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>📅 Previsão: {format(parse(viagem.previsao_inicio, 'yyyy-MM-dd', new Date()), 'dd/MM', {
                locale: ptBR
              })}</span>
            </div>
            {viagem.data_inicio && <div className="flex items-center gap-1 text-green-600">
                <span>✅ Iniciado: {format(new Date(viagem.data_inicio), 'dd/MM HH:mm', {
                locale: ptBR
              })}</span>
              </div>}
            {viagem.data_fim && <div className="flex items-center gap-1 text-blue-600">
                <span>🏁 Fim: {format(new Date(viagem.data_fim), 'dd/MM HH:mm', {
                locale: ptBR
              })}</span>
              </div>}
          </div>
          
          {viagem.observacoes && <p className="text-xs text-muted-foreground mt-2 truncate">
              {viagem.observacoes}
            </p>}
        </CardContent>
      </Card>
    </div>;
};
export const ViagemKanbanBoard: React.FC<ViagemKanbanBoardProps> = ({
  viagens,
  onViagemSelect
}) => {
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const updateViagemData = useUpdateViagemData();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // Filtrar viagens - excluir entregues/concluídas do kanban
  const filteredViagens = useMemo(() => {
    return viagens.filter(viagem => {
      // Excluir viagens entregues/concluídas
      if (viagem.status === 'entregue' || viagem.status === 'concluida') {
        return false;
      }
      
      const matchesSearch = viagem.numero?.toLowerCase().includes(searchTerm.toLowerCase()) || viagem.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || viagem.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [viagens, searchTerm, statusFilter]);

  // Gerar datas para timeline - período expandido para scroll contínuo
  const dates = useMemo(() => {
    const today = new Date();
    const daysToShow = viewType === 'daily' ? 90 : viewType === 'weekly' ? 180 : 365;
    const daysBefore = Math.floor(daysToShow / 2);
    const startDate = subDays(today, daysBefore);
    return Array.from({
      length: daysToShow
    }, (_, i) => addDays(startDate, i));
  }, [viewType]);

  // Organizar viagens por data de início real ou previsão
  const viagensByDate = useMemo(() => {
    const result: {
      [key: string]: Viagem[];
    } = {};
    dates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      result[dateKey] = filteredViagens.filter(viagem => {
        // Se a viagem já foi iniciada, usar data_inicio
        if (viagem.data_inicio) {
          const dataInicio = new Date(viagem.data_inicio);
          return isSameDay(dataInicio, date);
        }
        // Caso contrário, usar previsao_inicio
        return viagem.previsao_inicio && isSameDay(parse(viagem.previsao_inicio, 'yyyy-MM-dd', new Date()), date);
      });
    });
    return result;
  }, [dates, filteredViagens]);
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    console.log('🎯 Drag End Event:', {
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data?.current
    });
    if (!over || !active.data.current) {
      console.log('❌ Drag cancelled: no over target or active data');
      return;
    }
    const viagem = active.data.current.viagem as Viagem;
    const currentDateIndex = active.data.current.dateIndex as number;
    const overId = String(over.id);
    console.log('📋 Viagem being dragged:', {
      viagemId: viagem.id,
      numero: viagem.numero,
      currentDateIndex,
      currentDate: dates[currentDateIndex] ? format(dates[currentDateIndex], 'yyyy-MM-dd') : 'unknown'
    });

    // Identificar a coluna alvo
    let newDateIndex: number | null = null;

    // Caso 1: soltou na coluna vazia (id: droppable-<idx>)
    if (overId.startsWith('droppable-')) {
      const parsed = parseInt(overId.replace('droppable-', ''), 10);
      if (!Number.isNaN(parsed)) {
        newDateIndex = parsed;
        console.log('📍 Dropped on empty column:', newDateIndex);
      }
    }

    // Caso 2: soltou sobre outro card (id: <uuid>-<idx>)
    if (newDateIndex === null) {
      const match = overId.match(/-(\d+)$/);
      if (match) {
        newDateIndex = parseInt(match[1], 10);
        console.log('📍 Dropped on card in column:', newDateIndex);
      }
    }
    if (newDateIndex === null || newDateIndex < 0 || newDateIndex >= dates.length) {
      console.log('❌ Invalid date index:', newDateIndex, 'Available dates:', dates.length);
      return;
    }

    // Verificar se mudou de posição
    if (newDateIndex === currentDateIndex) {
      console.log('ℹ️ No position change, staying in same column');
      return;
    }
    const newDate = dates[newDateIndex];
    if (!newDate) {
      console.log('❌ New date not found for index:', newDateIndex);
      return;
    }
    console.log('📅 Date change:', {
      from: format(dates[currentDateIndex], 'yyyy-MM-dd'),
      to: format(newDate, 'yyyy-MM-dd'),
      indexChange: `${currentDateIndex} → ${newDateIndex}`
    });

    // Atualizar apenas a previsão de início - data_inicio e data_fim são gerenciadas pelo motorista
    const novaPrevisaoInicio = format(newDate, 'yyyy-MM-dd');
    console.log('🔄 Updating viagem previsao_inicio:', {
      viagemId: viagem.id,
      oldPrevisao: viagem.previsao_inicio,
      newPrevisao: novaPrevisaoInicio
    });
    updateViagemData.mutate({
      viagemId: viagem.id,
      previsao_inicio: novaPrevisaoInicio
    });
  };

  // Auto-scroll para "Hoje" ao carregar ou mudar tipo de visualização
  useEffect(() => {
    const scrollToToday = () => {
      if (!scrollContainerRef.current) return;
      const today = new Date();
      const todayIndex = dates.findIndex(date => isSameDay(date, today));
      if (todayIndex !== -1) {
        const columnWidth = 192; // 48 * 4 (w-48)
        const containerWidth = scrollContainerRef.current.offsetWidth;
        const scrollPosition = todayIndex * columnWidth - containerWidth / 2 + columnWidth / 2;
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    };

    // Delay para garantir que o DOM está renderizado
    const timer = setTimeout(scrollToToday, 100);
    return () => clearTimeout(timer);
  }, [dates, viewType]);
  const scrollToToday = () => {
    if (!scrollContainerRef.current) return;
    const today = new Date();
    const todayIndex = dates.findIndex(date => isSameDay(date, today));
    if (todayIndex !== -1) {
      const columnWidth = 192;
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollPosition = todayIndex * columnWidth - containerWidth / 2 + columnWidth / 2;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  };
  return <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="planejada">Planejada</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={scrollToToday}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Voltar para Hoje
          </Button>
        </div>
      </div>

      {/* Timeline Kanban Container Responsivo */}
      <div className="w-full max-w-full overflow-hidden">
        <div className="border rounded-lg bg-background">
          <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-hidden h-[600px] scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
            <div style={{
            width: `${dates.length * 192}px`
          }}>
              {/* Header com datas */}
              <div className="flex border-b bg-muted/50" style={{
              width: `${dates.length * 192}px`
            }}>
                {dates.map((date, index) => {
                const isToday = isSameDay(date, new Date());
                return <div key={index} className={`flex-shrink-0 w-48 p-3 border-r text-center ${isToday ? 'bg-primary/10 border-primary' : ''}`}>
                      <div className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                        {format(date, 'EEE', {
                      locale: ptBR
                    })}
                      </div>
                      <div className={`text-sm ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {format(date, 'dd/MM', {
                      locale: ptBR
                    })}
                      </div>
                      {isToday && <div className="text-xs text-primary font-medium mt-1">
                          Hoje
                        </div>}
                    </div>;
              })}
              </div>

              {/* Área de drop das viagens */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="flex min-h-96" style={{
                width: `${dates.length * 192}px`
              }}>
                  {dates.map((date, dateIndex) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const viagensNaData = viagensByDate[dateKey] || [];
                  return <SortableContext key={dateIndex} id={dateIndex.toString()} items={viagensNaData.map(v => `${v.id}-${dateIndex}`)} strategy={verticalListSortingStrategy}>
                        <DroppableColumn dateIndex={dateIndex}>
                          {viagensNaData.map(viagem => <SortableViagemCard key={`${viagem.id}-${dateIndex}`} viagem={viagem} dateIndex={dateIndex} onClick={() => onViagemSelect?.(viagem)} />)}
                        </DroppableColumn>
                      </SortableContext>;
                })}
                </div>
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="text-muted-foreground">Legenda:</div>
        {Object.entries(statusBadges).map(([status, config]) => <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span>{config.label}</span>
          </div>)}
      </div>
    </div>;
};