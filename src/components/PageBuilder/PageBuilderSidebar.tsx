import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BLOCOS_DISPONIVEIS, TipoBlocoLoja } from './types';

interface PageBuilderSidebarProps {
  onAddBloco: (tipo: TipoBlocoLoja) => void;
}

export function PageBuilderSidebar({ onAddBloco }: PageBuilderSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Blocos Disponíveis</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Clique para adicionar ao layout
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {BLOCOS_DISPONIVEIS.map((bloco) => (
            <Button
              key={bloco.tipo}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-3"
              onClick={() => onAddBloco(bloco.tipo)}
            >
              <span className="text-xl mr-3">{bloco.icone}</span>
              <div className="text-left">
                <div className="font-medium text-sm">{bloco.nome}</div>
                <div className="text-xs text-muted-foreground">{bloco.descricao}</div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
