import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { BlocoLoja, BLOCOS_DISPONIVEIS } from './types';
import { BlockRenderer } from './BlockRenderer';
import { cn } from '@/lib/utils';

interface LojaData {
  nome_loja: string;
  descricao?: string;
  logo_url?: string;
  banner_url?: string;
  email_contato?: string;
  whatsapp?: string;
  horario_atendimento?: string;
  mostrar_telefone?: boolean;
}

interface Anuncio {
  id: string;
  titulo: string;
  preco_unitario: number;
  preco_promocional?: number | null;
  quantidade_minima: number;
  unidade_venda: string;
  categoria?: string | null;
  imagens?: string[] | null;
  descricao_anuncio?: string | null;
}

interface SortableBlocoProps {
  bloco: BlocoLoja;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  lojaData?: LojaData;
  anuncios: Anuncio[];
  lojaSlug: string;
}

function SortableBloco({ bloco, isSelected, onSelect, onRemove, lojaData, anuncios, lojaSlug }: SortableBlocoProps) {
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
        "relative group rounded-lg border-2 mb-2 transition-all bg-background",
        isSelected && "ring-2 ring-primary border-primary",
        !isSelected && "border-transparent hover:border-border",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      {/* Floating Toolbar */}
      <div className={cn(
        "absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-background border shadow-sm transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <span className="text-xs font-medium px-1">{definicao?.nome}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Block Preview */}
      <div className="cursor-pointer overflow-hidden rounded-lg">
        <BlockRenderer 
          bloco={bloco} 
          lojaData={lojaData}
          anuncios={anuncios}
          lojaSlug={lojaSlug}
          isPreview={true}
        />
      </div>
    </div>
  );
}

interface PageBuilderCanvasProps {
  blocos: BlocoLoja[];
  selectedBlocoId: string | null;
  onSelectBloco: (id: string | null) => void;
  onRemoveBloco: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  lojaData?: LojaData;
  anuncios?: Anuncio[];
  lojaSlug?: string;
}

export function PageBuilderCanvas({
  blocos,
  selectedBlocoId,
  onSelectBloco,
  onRemoveBloco,
  onReorder,
  lojaData,
  anuncios = [],
  lojaSlug = ''
}: PageBuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
        <h3 className="font-semibold text-sm">Preview da Loja</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em um bloco para editar, arraste para reordenar
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {blocos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-lg font-medium">Página vazia</p>
              <p className="text-sm">Clique nos blocos à esquerda para começar</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocos.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                  {blocos.map((bloco) => (
                    <SortableBloco
                      key={bloco.id}
                      bloco={bloco}
                      isSelected={selectedBlocoId === bloco.id}
                      onSelect={() => onSelectBloco(bloco.id)}
                      onRemove={() => onRemoveBloco(bloco.id)}
                      lojaData={lojaData}
                      anuncios={anuncios}
                      lojaSlug={lojaSlug}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
