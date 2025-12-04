import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface ProdutosGridBlockConfig {
  titulo?: string
  mostrarBusca?: boolean
  mostrarCategorias?: boolean
  colunas?: number
  limite?: number
}

interface Anuncio {
  id: string
  titulo: string
  preco_unitario: number
  preco_promocional?: number | null
  quantidade_minima: number
  unidade_venda: string
  categoria?: string | null
  imagens?: string[] | null
  descricao_anuncio?: string | null
}

interface ProdutosGridBlockProps {
  config: ProdutosGridBlockConfig
  anuncios?: Anuncio[]
  lojaSlug?: string
  isPreview?: boolean
}

function ProdutoCard({ anuncio, lojaSlug, isPreview }: { anuncio: Anuncio; lojaSlug: string; isPreview?: boolean }) {
  const precoFinal = anuncio.preco_promocional || anuncio.preco_unitario
  const temDesconto = anuncio.preco_promocional && anuncio.preco_promocional < anuncio.preco_unitario
  const desconto = temDesconto
    ? Math.round((1 - anuncio.preco_promocional! / anuncio.preco_unitario) * 100)
    : 0

  const content = (
    <Card className="group hover:shadow-lg transition-shadow h-full">
      <CardContent className="p-0">
        <div className={`relative bg-muted overflow-hidden rounded-t-lg ${isPreview ? 'aspect-[4/3]' : 'aspect-square'}`}>
          {anuncio.imagens && anuncio.imagens.length > 0 ? (
            <img
              src={anuncio.imagens[0]}
              alt={anuncio.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className={isPreview ? 'h-8 w-8' : 'h-16 w-16'} />
            </div>
          )}
          {temDesconto && (
            <Badge className={`absolute top-2 left-2 bg-red-500 ${isPreview ? 'text-xs px-1' : ''}`}>
              -{desconto}%
            </Badge>
          )}
        </div>

        <div className={`space-y-1 ${isPreview ? 'p-2' : 'p-4 space-y-2'}`}>
          <h3 className={`font-medium line-clamp-2 group-hover:text-primary transition-colors ${isPreview ? 'text-xs' : ''}`}>
            {anuncio.titulo}
          </h3>

          <div className={`flex items-baseline gap-1 ${isPreview ? '' : 'pt-2'}`}>
            <span className={`font-bold text-primary ${isPreview ? 'text-sm' : 'text-xl'}`}>
              R$ {precoFinal.toFixed(2)}
            </span>
            <span className={`text-muted-foreground ${isPreview ? 'text-[10px]' : 'text-sm'}`}>
              /{anuncio.unidade_venda}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isPreview) {
    return <div className="cursor-pointer">{content}</div>
  }

  return (
    <Link to={`/loja/${lojaSlug}/produto/${anuncio.id}`}>
      {content}
    </Link>
  )
}

export function ProdutosGridBlock({ config, anuncios = [], lojaSlug = "", isPreview }: ProdutosGridBlockProps) {
  const colunas = config.colunas || 4
  const limite = config.limite || 0

  const anunciosFiltrados = useMemo(() => {
    let filtered = [...anuncios]
    if (limite > 0) {
      filtered = filtered.slice(0, limite)
    }
    return filtered
  }, [anuncios, limite])

  // Preview placeholder products
  const previewProducts: Anuncio[] = isPreview && anuncios.length === 0 ? [
    { id: "1", titulo: "Produto Exemplo 1", preco_unitario: 99.90, quantidade_minima: 1, unidade_venda: "un" },
    { id: "2", titulo: "Produto Exemplo 2", preco_unitario: 149.90, preco_promocional: 129.90, quantidade_minima: 1, unidade_venda: "un" },
    { id: "3", titulo: "Produto Exemplo 3", preco_unitario: 79.90, quantidade_minima: 1, unidade_venda: "kg" },
    { id: "4", titulo: "Produto Exemplo 4", preco_unitario: 199.90, quantidade_minima: 1, unidade_venda: "un" },
  ] : anunciosFiltrados

  const gridCols = isPreview 
    ? "grid-cols-2 sm:grid-cols-4" 
    : `grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(colunas, 4)} xl:grid-cols-${colunas}`

  return (
    <div className="container mx-auto px-4 py-4">
      {previewProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className={`text-muted-foreground mb-3 ${isPreview ? 'h-8 w-8' : 'h-12 w-12'}`} />
            <h3 className={`font-semibold mb-1 ${isPreview ? 'text-sm' : 'text-lg'}`}>Nenhum produto</h3>
            <p className={`text-muted-foreground ${isPreview ? 'text-xs' : 'text-sm'}`}>
              Configure seus produtos na aba "Minha Loja"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${gridCols} gap-${isPreview ? '2' : '4'}`}>
          {previewProducts.map((anuncio) => (
            <ProdutoCard key={anuncio.id} anuncio={anuncio} lojaSlug={lojaSlug} isPreview={isPreview} />
          ))}
        </div>
      )}
    </div>
  )
}
