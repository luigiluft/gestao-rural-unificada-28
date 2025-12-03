import { Link } from "react-router-dom"
import { useCarrinho } from "@/contexts/CarrinhoContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react"

export function CarrinhoDrawer() {
  const { itens, removerItem, atualizarQuantidade, totalItens, subtotal } = useCarrinho()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItens > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {totalItens}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho ({totalItens} {totalItens === 1 ? "item" : "itens"})
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
              <Link to="/checkout" className="w-full">
                <Button className="w-full" size="lg">
                  Finalizar Pedido
                </Button>
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
