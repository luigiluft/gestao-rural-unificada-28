import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useCarrinho } from "@/contexts/CarrinhoContext"
import { useProfile } from "@/hooks/useProfile"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, User, LogIn } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, Package } from "lucide-react"

interface HeaderActionsProps {
  /** URL para página de login */
  loginUrl: string
  /** URL para "minha conta" quando logado */
  minhaContaUrl: string
  /** URL para checkout */
  checkoutUrl?: string
}

export function HeaderActions({ loginUrl, minhaContaUrl, checkoutUrl = "/checkout" }: HeaderActionsProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { itens, removerItem, atualizarQuantidade, subtotal } = useCarrinho()

  const quantidadeProdutosDiferentes = itens.length

  const handleAuthClick = () => {
    if (user) {
      navigate(minhaContaUrl)
    } else {
      navigate(loginUrl)
    }
  }

  // Get first name for display
  const displayName = profile?.nome?.split(" ")[0] || user?.email?.split("@")[0] || "Usuário"

  return (
    <div className="flex items-center gap-2">
      {/* Cart Button with Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {quantidadeProdutosDiferentes > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {quantidadeProdutosDiferentes}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho ({quantidadeProdutosDiferentes} {quantidadeProdutosDiferentes === 1 ? "item" : "itens"})
            </SheetTitle>
          </SheetHeader>

          {itens.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <Link to="/marketplace" className="mt-4">
                <Button variant="outline">Explorar Produtos</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {itens.map((item) => {
                  const preco = item.anuncio.preco_promocional || item.anuncio.preco_unitario
                  const total = preco * item.quantidade

                  return (
                    <div key={item.anuncio.id} className="flex gap-3">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.anuncio.imagens?.[0] ? (
                          <img
                            src={item.anuncio.imagens[0]}
                            alt={item.anuncio.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.anuncio.titulo}</h4>
                        <p className="text-xs text-muted-foreground">
                          {item.anuncio.loja?.nome_loja}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          R$ {preco.toFixed(2)} / {item.anuncio.unidade_venda}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                atualizarQuantidade(
                                  item.anuncio.id,
                                  Math.max(item.anuncio.quantidade_minima, item.quantidade - 1)
                                )
                              }
                              disabled={item.quantidade <= item.anuncio.quantidade_minima}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantidade}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                atualizarQuantidade(item.anuncio.id, item.quantidade + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removerItem(item.anuncio.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">R$ {total.toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <SheetFooter className="flex-col gap-4 pt-4">
                <div className="flex justify-between w-full text-lg font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">R$ {subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Frete calculado no checkout
                </p>
                <Link to={checkoutUrl} className="w-full">
                  <Button className="w-full" size="lg">
                    Finalizar Pedido
                  </Button>
                </Link>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Auth Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleAuthClick}
        className="gap-2"
      >
        {user ? (
          <>
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{displayName}</span>
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar / Cadastrar</span>
          </>
        )}
      </Button>
    </div>
  )
}
