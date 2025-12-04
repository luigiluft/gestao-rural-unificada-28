import { useState } from "react"
import { useMarketplaceAnuncios, MarketplaceAnuncio } from "@/hooks/useMarketplace"
import { useMarketplaceCategorias } from "@/hooks/useMarketplaceCategorias"
import { useAuth } from "@/contexts/AuthContext"
import { CarrinhoDrawer } from "@/components/Marketplace/CarrinhoDrawer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Package, Store, ShoppingCart, Loader2, User, Heart } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useConsumidorWishlist } from "@/hooks/useConsumidorWishlist"

function ProdutoCard({ anuncio }: { anuncio: MarketplaceAnuncio }) {
  const { user } = useAuth()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useConsumidorWishlist()
  const inWishlist = isInWishlist(anuncio.id)
  
  const precoFinal = anuncio.preco_promocional || anuncio.preco_unitario
  const temDesconto = anuncio.preco_promocional && anuncio.preco_promocional < anuncio.preco_unitario
  const desconto = temDesconto
    ? Math.round((1 - anuncio.preco_promocional! / anuncio.preco_unitario) * 100)
    : 0

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    if (inWishlist) {
      removeFromWishlist(anuncio.id)
    } else {
      addToWishlist(anuncio.id)
    }
  }

  return (
    <Link to={`/marketplace/produto/${anuncio.id}`}>
      <Card className="group hover:shadow-lg transition-shadow h-full">
        <CardContent className="p-0">
          {/* Imagem */}
          <div className="aspect-square relative bg-muted overflow-hidden rounded-t-lg">
            {anuncio.imagens && anuncio.imagens.length > 0 ? (
              <img
                src={anuncio.imagens[0]}
                alt={anuncio.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {temDesconto && (
              <Badge className="absolute top-2 left-2 bg-red-500">
                -{desconto}%
              </Badge>
            )}
            {user && (
              <button
                onClick={handleWishlistClick}
                className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
              >
                <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            {anuncio.loja && (
              <Link
                to={`/loja/${anuncio.loja.slug}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <Store className="h-3 w-3" />
                {anuncio.loja.nome_loja}
              </Link>
            )}

            <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {anuncio.titulo}
            </h3>

            {anuncio.categoria && (
              <Badge variant="secondary" className="text-xs">
                {anuncio.categoria}
              </Badge>
            )}

            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-xl font-bold text-primary">
                R$ {precoFinal.toFixed(2)}
              </span>
              {temDesconto && (
                <span className="text-sm text-muted-foreground line-through">
                  R$ {anuncio.preco_unitario.toFixed(2)}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                /{anuncio.unidade_venda}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Mín. {anuncio.quantidade_minima} {anuncio.unidade_venda}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function Marketplace() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [busca, setBusca] = useState("")
  const [categoria, setCategoria] = useState("Todos")
  const [orderBy, setOrderBy] = useState<"recentes" | "preco_asc" | "preco_desc">("recentes")

  const { data: categorias, isLoading: categoriasLoading } = useMarketplaceCategorias()
  const { data: anuncios, isLoading, isError } = useMarketplaceAnuncios({
    busca: busca || undefined,
    categoria: categoria !== "Todos" ? categoria : undefined,
    orderBy,
  })

  const handleMinhaContaClick = () => {
    if (user) {
      navigate("/marketplace/minha-conta")
    } else {
      navigate("/auth?redirect=/marketplace/minha-conta")
    }
  }

  const categoriasToShow = categorias || ["Todos"]

  return (
    <div className="min-h-screen bg-background">
        {/* Header with cart */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/marketplace" className="font-bold text-xl text-primary">
              AgroHub
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMinhaContaClick}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user ? "Minha Conta" : "Entrar"}
                </span>
              </Button>
              <CarrinhoDrawer />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-primary/5 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Marketplace AgroHub
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
              Encontre produtos frescos direto dos produtores rurais. Qualidade garantida e preços justos.
            </p>

            {/* Busca */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Produtos */}
        <div className="container mx-auto px-4 py-8">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {categoriasLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando categorias...</span>
                </div>
              ) : (
                categoriasToShow.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoria === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoria(cat)}
                  >
                    {cat}
                  </Button>
                ))
              )}
            </div>

            <div className="md:ml-auto">
              <Select value={orderBy} onValueChange={(v: any) => setOrderBy(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                  <SelectItem value="preco_asc">Menor preço</SelectItem>
                  <SelectItem value="preco_desc">Maior preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Produtos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar produtos</h3>
                <p className="text-muted-foreground">Não foi possível carregar os produtos. Tente novamente.</p>
              </CardContent>
            </Card>
          ) : anuncios?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  {busca ? "Tente buscar com outros termos" : "Ainda não há produtos disponíveis"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {anuncios?.map((anuncio) => (
                <ProdutoCard key={anuncio.id} anuncio={anuncio} />
              ))}
            </div>
          )}
        </div>
      </div>
  )
}
