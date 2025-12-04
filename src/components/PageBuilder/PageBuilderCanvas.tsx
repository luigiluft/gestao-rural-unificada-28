import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { BlocoLoja, BLOCOS_DISPONIVEIS } from './types';
import { cn } from '@/lib/utils';

interface SortableBlocoProps {
  bloco: BlocoLoja;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableBloco({ bloco, isSelected, onSelect, onRemove }: SortableBlocoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bloco.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const definicao = BLOCOS_DISPONIVEIS.find(b => b.tipo === bloco.tipo);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-4 mb-3 cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary border-primary",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xl">{definicao?.icone}</span>
        <div className="flex-1">
          <div className="font-medium text-sm">{definicao?.nome}</div>
          <div className="text-xs text-muted-foreground">
            {bloco.config.titulo || bloco.config.conteudo?.substring(0, 30) || 'Sem título'}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface PageBuilderCanvasProps {
  blocos: BlocoLoja[];
  selectedBlocoId: string | null;
  onSelectBloco: (id: string) => void;
  onRemoveBloco: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function PageBuilderCanvas({
  blocos,
  selectedBlocoId,
  onSelectBloco,
  onRemoveBloco,
  onReorder
}: PageBuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  }

  return (
    <div className="flex-1 bg-muted/20 flex flex-col">
      <div className="p-4 border-b bg-background">
        <h3 className="font-semibold text-sm">Preview do Layout</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste para reordenar os blocos
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 max-w-2xl mx-auto">
          {blocos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum bloco adicionado.</p>
              <p className="text-sm">Clique nos blocos à esquerda para começar.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocos.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocos.map((bloco) => (
                  <SortableBloco
                    key={bloco.id}
                    bloco={bloco}
                    isSelected={selectedBlocoId === bloco.id}
                    onSelect={() => onSelectBloco(bloco.id)}
                    onRemove={() => onRemoveBloco(bloco.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
