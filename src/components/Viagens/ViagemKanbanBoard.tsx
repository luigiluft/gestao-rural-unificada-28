import React, { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, Truck, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useUpdateViagemData } from '@/hooks/useUpdateViagemData'
import { format, addDays, subDays, isSameDay, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Viagem {
  id: string
  numero: string
  data_inicio: string
  data_fim: string
  status: string
  observacoes?: string
  progresso?: number
}

interface ViagemKanbanBoardProps {
  viagens: Viagem[]
  onViagemSelect?: (viagem: Viagem) => void
}

type ViewType = 'daily' | 'weekly' | 'monthly'

const statusBadges = {
  planejada: { label: 'Planejada', variant: 'secondary' as const, color: 'bg-blue-500' },
  em_andamento: { label: 'Em Andamento', variant: 'default' as const, color: 'bg-amber-500' },
  concluida: { label: 'Concluída', variant: 'outline' as const, color: 'bg-green-500' },
  cancelada: { label: 'Cancelada', variant: 'destructive' as const, color: 'bg-red-500' }
}

interface SortableViagemCardProps {
  viagem: Viagem
  onClick?: () => void
  dateIndex: number
}

const SortableViagemCard: React.FC<SortableViagemCardProps> = ({ viagem, onClick, dateIndex }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `${viagem.id}-${dateIndex}`,
    data: { viagem, dateIndex }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const statusConfig = statusBadges[viagem.status as keyof typeof statusBadges] || statusBadges.planejada

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card 
        className={`mb-2 hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
        onClick={onClick}
      >
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
              <span>Início: {format(parseISO(viagem.data_inicio), 'dd/MM', { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>Entrega: {format(parseISO(viagem.data_fim), 'dd/MM', { locale: ptBR })}</span>
            </div>
          </div>
          
          {viagem.observacoes && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {viagem.observacoes}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const ViagemKanbanBoard: React.FC<ViagemKanbanBoardProps> = ({ 
  viagens, 
  onViagemSelect 
}) => {
  const [viewType, setViewType] = useState<ViewType>('daily')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [centerDate, setCenterDate] = useState(new Date())
  
  const updateViagemData = useUpdateViagemData()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filtrar viagens
  const filteredViagens = useMemo(() => {
    return viagens.filter(viagem => {
      const matchesSearch = viagem.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           viagem.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || viagem.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [viagens, searchTerm, statusFilter])

  // Gerar datas para timeline
  const dates = useMemo(() => {
    const daysToShow = viewType === 'daily' ? 14 : viewType === 'weekly' ? 28 : 60
    const startDate = subDays(centerDate, Math.floor(daysToShow / 2))
    
    return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i))
  }, [centerDate, viewType])

  // Organizar viagens por data de início
  const viagensByDate = useMemo(() => {
    const result: { [key: string]: Viagem[] } = {}
    
    dates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      result[dateKey] = filteredViagens.filter(viagem => 
        isSameDay(parseISO(viagem.data_inicio), date)
      )
    })
    
    return result
  }, [dates, filteredViagens])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current) return

    const viagem = active.data.current.viagem as Viagem
    const newDateIndex = parseInt(over.id.toString())
    const newDate = dates[newDateIndex]
    
    if (!newDate) return

    // Não permitir mover para data anterior à data de início
    const dataInicio = parseISO(viagem.data_inicio)
    if (newDate < dataInicio) {
      return
    }

    // Calcular nova data de fim baseada na diferença original
    const dataFimOriginal = parseISO(viagem.data_fim)
    const diasOriginais = differenceInDays(dataFimOriginal, dataInicio)
    const novaDataFim = addDays(newDate, diasOriginais)

    updateViagemData.mutate({
      viagemId: viagem.id,
      data_fim: format(novaDataFim, 'yyyy-MM-dd')
    })
  }

  const resetView = () => {
    setCenterDate(new Date())
  }

  const navigateTimeline = (direction: 'prev' | 'next') => {
    const daysToMove = viewType === 'daily' ? 7 : viewType === 'weekly' ? 14 : 30
    setCenterDate(prev => 
      direction === 'next' 
        ? addDays(prev, daysToMove)
        : subDays(prev, daysToMove)
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar viagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
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
          
          <Button variant="outline" size="sm" onClick={() => navigateTimeline('prev')}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTimeline('next')}>
            →
          </Button>
        </div>
      </div>

      {/* Timeline Kanban */}
      <div className="border rounded-lg bg-background">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header com datas */}
            <div className="flex border-b bg-muted/50">
              {dates.map((date, index) => {
                const isToday = isSameDay(date, new Date())
                return (
                  <div 
                    key={index}
                    className={`flex-shrink-0 w-48 p-3 border-r text-center ${
                      isToday ? 'bg-primary/10 border-primary' : ''
                    }`}
                  >
                    <div className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                      {format(date, 'EEE', { locale: ptBR })}
                    </div>
                    <div className={`text-sm ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {format(date, 'dd/MM', { locale: ptBR })}
                    </div>
                    {isToday && (
                      <div className="text-xs text-primary font-medium mt-1">
                        Hoje
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Área de drop das viagens */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex min-h-96">
                {dates.map((date, dateIndex) => {
                  const dateKey = format(date, 'yyyy-MM-dd')
                  const viagensNaData = viagensByDate[dateKey] || []
                  
                  return (
                    <SortableContext 
                      key={dateIndex}
                      id={dateIndex.toString()}
                      items={viagensNaData.map(v => `${v.id}-${dateIndex}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div 
                        className="flex-shrink-0 w-48 p-3 border-r min-h-96 bg-background hover:bg-muted/30 transition-colors"
                        data-date-index={dateIndex}
                      >
                        {viagensNaData.map((viagem) => (
                          <SortableViagemCard
                            key={`${viagem.id}-${dateIndex}`}
                            viagem={viagem}
                            dateIndex={dateIndex}
                            onClick={() => onViagemSelect?.(viagem)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )
                })}
              </div>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="text-muted-foreground">Legenda:</div>
        {Object.entries(statusBadges).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}