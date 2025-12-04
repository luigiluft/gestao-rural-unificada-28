import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Search } from "lucide-react"

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
  const [busca, setBusca] = useState("")
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)

  const mostrarBusca = config.mostrarBusca !== false
  const mostrarCategorias = config.mostrarCategorias !== false
  const colunas = config.colunas || 4
  const limite = config.limite || 0

  const categorias = useMemo(() => {
    const cats = anuncios
      .map(a => a.categoria)
      .filter((c): c is string => !!c)
    return [...new Set(cats)]
  }, [anuncios])

  const anunciosFiltrados = useMemo(() => {
    let filtered = anuncios.filter(a => {
      const matchBusca = !busca || 
        a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        a.descricao_anuncio?.toLowerCase().includes(busca.toLowerCase())
      const matchCategoria = !categoriaSelecionada || a.categoria === categoriaSelecionada
      return matchBusca && matchCategoria
    })
    
    if (limite > 0) {
      filtered = filtered.slice(0, limite)
    }
    
    return filtered
  }, [anuncios, busca, categoriaSelecionada, limite])

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
    <div className="container mx-auto px-4 py-6">
      {config.titulo && (
        <h2 className={`font-bold mb-4 ${isPreview ? 'text-sm' : 'text-xl'}`}>{config.titulo}</h2>
      )}

      {mostrarBusca && !isPreview && (
        <div className="max-w-md mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {mostrarCategorias && categorias.length > 0 && !isPreview && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={categoriaSelecionada === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoriaSelecionada(null)}
          >
            Todos
          </Button>
          {categorias.map((cat) => (
            <Button
              key={cat}
              variant={categoriaSelecionada === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoriaSelecionada(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {previewProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
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
