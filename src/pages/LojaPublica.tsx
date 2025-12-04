import { useState, useMemo } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useLojaAnunciosPublicos, MarketplaceAnuncio } from "@/hooks/useMarketplace"
import { HeaderActions } from "@/components/Marketplace/HeaderActions"
import { PlatformLogo } from "@/components/Marketplace/PlatformLogo"
import { FloatingAtendimentoButton } from "@/components/Loja/FloatingAtendimentoButton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Package, Store, Mail, Phone, Clock, Loader2, ArrowLeft, FileText, Home } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

function ProdutoCard({ anuncio, lojaSlug }: { anuncio: MarketplaceAnuncio; lojaSlug: string }) {
  const precoFinal = anuncio.preco_promocional || anuncio.preco_unitario
  const temDesconto = anuncio.preco_promocional && anuncio.preco_promocional < anuncio.preco_unitario
  const desconto = temDesconto
    ? Math.round((1 - anuncio.preco_promocional! / anuncio.preco_unitario) * 100)
    : 0

  return (
    <Link to={`/loja/${lojaSlug}/produto/${anuncio.id}`}>
      <Card className="group hover:shadow-lg transition-shadow h-full">
        <CardContent className="p-0">
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
          </div>

          <div className="p-4 space-y-2">
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

export default function LojaPublica() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [busca, setBusca] = useState("")
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)
  const { data, isLoading, isError } = useLojaAnunciosPublicos(slug || "")

  // Extract unique categories
  const categorias = useMemo(() => {
    if (!data?.anuncios) return []
    const cats = data.anuncios
      .map(a => a.categoria)
      .filter((c): c is string => !!c)
    return [...new Set(cats)]
  }, [data?.anuncios])

  const anunciosFiltrados = data?.anuncios.filter(a => {
    const matchBusca = !busca || 
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.descricao_anuncio?.toLowerCase().includes(busca.toLowerCase())
    const matchCategoria = !categoriaSelecionada || a.categoria === categoriaSelecionada
    return matchBusca && matchCategoria
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Loja não encontrada</h1>
        <p className="text-muted-foreground">A loja que você procura não existe ou foi desativada.</p>
        <Link to="/marketplace">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Marketplace
          </Button>
        </Link>
      </div>
    )
  }

  const { loja, anuncios } = data

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with cart and auth */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors" title="Ir para Marketplace">
                <Home className="h-5 w-5" />
              </Link>
              <PlatformLogo to="/marketplace" size="sm" />
            </div>
          <HeaderActions 
            loginUrl={`/loja/${slug}/auth`}
            minhaContaUrl={`/loja/${slug}/minha-conta`}
          />
        </div>
      </div>

      {/* Header da Loja */}
      <div className="relative">
        {loja.banner_url ? (
          <div className="h-48 md:h-64 w-full overflow-hidden">
            <img
              src={loja.banner_url}
              alt={`Banner ${loja.nome_loja}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-primary/10" />
        )}

        <div className="container mx-auto px-4">
          <div className="relative -mt-16 flex items-end gap-4 pb-6">
            <div className="w-32 h-32 rounded-xl bg-background shadow-lg overflow-hidden border-4 border-background">
              {loja.logo_url ? (
                <img
                  src={loja.logo_url}
                  alt={loja.nome_loja}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Store className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{loja.nome_loja}</h1>
              {loja.descricao && (
                <p className="text-muted-foreground mt-1 line-clamp-2">{loja.descricao}</p>
              )}
            </div>
          </div>

          {/* Info de contato */}
          <div className="flex flex-wrap gap-4 pb-6 text-sm text-muted-foreground">
            {loja.email_contato && loja.mostrar_telefone && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {loja.email_contato}
              </div>
            )}
            {loja.whatsapp && loja.mostrar_telefone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {loja.whatsapp}
              </div>
            )}
            {loja.horario_atendimento && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {loja.horario_atendimento}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <Tabs defaultValue="spot" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="spot" className="gap-2">
                <Package className="h-4 w-4" />
                Spot
              </TabsTrigger>
              <TabsTrigger value="cotacao" className="gap-2">
                <FileText className="h-4 w-4" />
                Cotação
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Spot Tab - Normal purchases */}
          <TabsContent value="spot" className="space-y-6">
            <div className="max-w-md">
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

            {/* Category Filters */}
            {categorias.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            {anunciosFiltrados?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground">
                    {busca || categoriaSelecionada ? "Tente buscar com outros termos ou limpar os filtros" : "Esta loja ainda não possui produtos"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {anunciosFiltrados?.map((anuncio) => (
                  <ProdutoCard key={anuncio.id} anuncio={anuncio} lojaSlug={slug || ""} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Cotação Tab */}
          <TabsContent value="cotacao">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-16 w-16 text-primary/30 mb-6" />
                <h3 className="text-2xl font-bold mb-2">Solicite uma Cotação</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Planeje suas compras para os próximos 12 meses. Informe a quantidade de cada produto 
                  que você precisará mês a mês e receba uma proposta personalizada.
                </p>
                <Button size="lg" onClick={() => navigate(`/loja/${slug}/cotacao`)}>
                  <FileText className="h-5 w-5 mr-2" />
                  Iniciar Cotação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {loja.logo_url ? (
                  <img src={loja.logo_url} alt={loja.nome_loja} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <Store className="h-10 w-10 text-primary" />
                )}
                <h3 className="font-bold text-lg">{loja.nome_loja}</h3>
              </div>
              {loja.descricao && (
                <p className="text-sm text-muted-foreground">{loja.descricao}</p>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contato</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {loja.email_contato && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${loja.email_contato}`} className="hover:text-primary">
                      {loja.email_contato}
                    </a>
                  </div>
                )}
                {loja.whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a 
                      href={`https://wa.me/${loja.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {loja.whatsapp}
                    </a>
                  </div>
                )}
                {loja.horario_atendimento && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{loja.horario_atendimento}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/marketplace" className="block text-muted-foreground hover:text-primary">
                  Marketplace AgroHub
                </Link>
                {!user && (
                  <Link to={`/loja/${slug}/auth`} className="block text-muted-foreground hover:text-primary">
                    Criar uma conta
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {loja.nome_loja}. Powered by AgroHub.</p>
          </div>
        </div>
      </footer>

      {/* Floating Atendimento Button */}
      <FloatingAtendimentoButton 
        clienteId={loja.cliente_id} 
        nomeLoja={loja.nome_loja} 
      />
    </div>
  )
}
