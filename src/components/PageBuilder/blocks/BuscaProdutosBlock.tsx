import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BuscaProdutosBlockProps {
  config: Record<string, any>;
  isPreview?: boolean;
}

export function BuscaProdutosBlock({ config, isPreview }: BuscaProdutosBlockProps) {
  return (
    <div className={`container mx-auto px-4 py-2 ${isPreview ? 'max-w-xs' : 'max-w-md'}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${isPreview ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <Input
          placeholder="Buscar produtos..."
          className={`pl-10 ${isPreview ? 'h-8 text-xs' : ''}`}
          disabled
        />
      </div>
    </div>
  );
}
