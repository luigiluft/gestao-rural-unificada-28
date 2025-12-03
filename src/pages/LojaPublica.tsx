import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useLojaAnunciosPublicos, MarketplaceAnuncio } from "@/hooks/useMarketplace"
import { CarrinhoDrawer } from "@/components/Marketplace/CarrinhoDrawer"
import { FloatingAtendimentoButton } from "@/components/Loja/FloatingAtendimentoButton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Package, Store, Mail, Phone, Clock, Loader2, ArrowLeft } from "lucide-react"

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
  const [busca, setBusca] = useState("")
  const { data, isLoading, isError } = useLojaAnunciosPublicos(slug || "")

  const anunciosFiltrados = data?.anuncios.filter(a => 
    !busca || 
    a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    a.descricao_anuncio?.toLowerCase().includes(busca.toLowerCase())
  )

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
    <div className="min-h-screen bg-background">
      {/* Header with cart */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/marketplace" className="font-bold text-xl text-primary">
            AgroHub
          </Link>
          <CarrinhoDrawer />
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

      {/* Busca e Produtos */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mb-8">
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

        {anunciosFiltrados?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {busca ? "Tente buscar com outros termos" : "Esta loja ainda não possui produtos"}
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
      </div>

      {/* Link voltar ao marketplace */}
      <div className="container mx-auto px-4 pb-8">
        <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar ao Marketplace AgroHub
        </Link>
      </div>

      {/* Floating Atendimento Button */}
      <FloatingAtendimentoButton 
        clienteId={loja.cliente_id} 
        nomeLoja={loja.nome_loja} 
      />
    </div>
  )
}
