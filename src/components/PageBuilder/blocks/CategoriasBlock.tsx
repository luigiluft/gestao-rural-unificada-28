import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface CategoriasBlockProps {
  config: Record<string, any>;
  anuncios?: Array<{ categoria?: string | null }>;
  isPreview?: boolean;
}

export function CategoriasBlock({ config, anuncios = [], isPreview }: CategoriasBlockProps) {
  const categorias = useMemo(() => {
    const cats = anuncios
      .map(a => a.categoria)
      .filter((c): c is string => !!c);
    return [...new Set(cats)];
  }, [anuncios]);

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="default" size={isPreview ? "sm" : "sm"} className={isPreview ? 'h-7 text-xs' : ''}>
          Todos
        </Button>
        {categorias.map((cat) => (
          <Button key={cat} variant="outline" size="sm" className={isPreview ? 'h-7 text-xs' : ''}>
            {cat}
          </Button>
        ))}
        {categorias.length === 0 && (
          <Button variant="outline" size="sm" className={isPreview ? 'h-7 text-xs' : ''} disabled>
            Categoria
          </Button>
        )}
      </div>
    </div>
  );
}
