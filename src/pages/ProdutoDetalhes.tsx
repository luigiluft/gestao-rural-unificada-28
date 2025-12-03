import { useParams, Link, useLocation } from "react-router-dom"
import { useAnuncioDetalhes, AnuncioDetalhesComLoja } from "@/hooks/useMarketplace"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package, Store, ArrowLeft, Phone, Mail, Loader2, ShoppingCart, Minus, Plus } from "lucide-react"
import { useState } from "react"

export default function ProdutoDetalhes() {
  const { id, slug } = useParams<{ id: string; slug?: string }>()
  const location = useLocation()
  const isFromLoja = location.pathname.includes("/loja/")
  const { data: anuncio, isLoading, isError } = useAnuncioDetalhes(id || "")
  const [quantidade, setQuantidade] = useState(1)
  const [imagemSelecionada, setImagemSelecionada] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !anuncio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <p className="text-muted-foreground">O produto que você procura não existe ou foi removido.</p>
        <Link to="/marketplace">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Marketplace
          </Button>
        </Link>
      </div>
    )
  }

  const precoFinal = anuncio.preco_promocional || anuncio.preco_unitario
  const temDesconto = anuncio.preco_promocional && anuncio.preco_promocional < anuncio.preco_unitario
  const desconto = temDesconto
    ? Math.round((1 - anuncio.preco_promocional! / anuncio.preco_unitario) * 100)
    : 0

  const valorTotal = precoFinal * quantidade

  const handleQuantidadeChange = (delta: number) => {
    const novaQuantidade = quantidade + delta
    if (novaQuantidade >= anuncio.quantidade_minima) {
      setQuantidade(novaQuantidade)
    }
  }

  const backLink = isFromLoja && slug ? `/loja/${slug}` : "/marketplace"
  const backLabel = isFromLoja ? "Voltar à Loja" : "Voltar ao Marketplace"

  // WhatsApp link
  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse no produto: ${anuncio.titulo}\nQuantidade: ${quantidade} ${anuncio.unidade_venda}\nValor: R$ ${valorTotal.toFixed(2)}`
  )
  const whatsappLink = anuncio.loja?.whatsapp 
    ? `https://wa.me/${anuncio.loja.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Voltar */}
        <Link to={backLink} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {backLabel}
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagens */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {anuncio.imagens && anuncio.imagens.length > 0 ? (
                <img
                  src={anuncio.imagens[imagemSelecionada]}
                  alt={anuncio.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {anuncio.imagens && anuncio.imagens.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {anuncio.imagens.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImagemSelecionada(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      idx === imagemSelecionada ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info do Produto */}
          <div className="space-y-6">
            {/* Loja */}
            {anuncio.loja && (
              <Link
                to={`/loja/${anuncio.loja.slug}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                {anuncio.loja.logo_url ? (
                  <img src={anuncio.loja.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                {anuncio.loja.nome_loja}
              </Link>
            )}

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{anuncio.titulo}</h1>
              {anuncio.categoria && (
                <Badge variant="secondary" className="mt-2">
                  {anuncio.categoria}
                </Badge>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  R$ {precoFinal.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/{anuncio.unidade_venda}</span>
              </div>
              {temDesconto && (
                <div className="flex items-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {anuncio.preco_unitario.toFixed(2)}
                  </span>
                  <Badge className="bg-red-500">-{desconto}%</Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Descrição */}
            {anuncio.descricao_anuncio && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{anuncio.descricao_anuncio}</p>
              </div>
            )}

            {/* Quantidade */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Quantidade</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantidadeChange(-1)}
                      disabled={quantidade <= anuncio.quantidade_minima}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantidade}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantidadeChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pedido mínimo: {anuncio.quantidade_minima} {anuncio.unidade_venda}
                </p>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {valorTotal.toFixed(2)}
                  </span>
                </div>

                {/* Botões de ação */}
                <div className="space-y-2">
                  {whatsappLink && (
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full" size="lg">
                        <Phone className="h-4 w-4 mr-2" />
                        Fazer Pedido via WhatsApp
                      </Button>
                    </a>
                  )}
                  {anuncio.loja?.email_contato && (
                    <a href={`mailto:${anuncio.loja.email_contato}?subject=Interesse: ${anuncio.titulo}`} className="block">
                      <Button variant="outline" className="w-full" size="lg">
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar E-mail
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {anuncio.tags && anuncio.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anuncio.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
