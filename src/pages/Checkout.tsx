import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useCarrinho } from "@/contexts/CarrinhoContext"
import { CarrinhoDrawer } from "@/components/Marketplace/CarrinhoDrawer"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Package, Loader2, CheckCircle, Store } from "lucide-react"

interface DadosComprador {
  nome: string
  email: string
  telefone: string
  cpf_cnpj: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  observacoes: string
}

export default function Checkout() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { itens, subtotal, limparCarrinho } = useCarrinho()
  const [loading, setLoading] = useState(false)
  const [pedidosCriados, setPedidosCriados] = useState<string[]>([])
  const [dados, setDados] = useState<DadosComprador>({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    observacoes: "",
  })

  // Group items by seller (cliente_id)
  const itensPorVendedor = itens.reduce((acc, item) => {
    const vendedorId = item.anuncio.cliente_id
    if (!acc[vendedorId]) {
      acc[vendedorId] = {
        loja: item.anuncio.loja,
        itens: [],
      }
    }
    acc[vendedorId].itens.push(item)
    return acc
  }, {} as Record<string, { loja: typeof itens[0]["anuncio"]["loja"]; itens: typeof itens }>)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDados((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dados.nome || !dados.email || !dados.telefone) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Nome, email e telefone são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const pedidosIds: string[] = []

      // Create one order per seller
      for (const [vendedorId, vendedor] of Object.entries(itensPorVendedor)) {
        const subtotalVendedor = vendedor.itens.reduce((acc, item) => {
          const preco = item.anuncio.preco_promocional || item.anuncio.preco_unitario
          return acc + preco * item.quantidade
        }, 0)

        // Generate numero_pedido
        const now = new Date()
        const numeroPedido = `PED-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        // Create order
        const { data: pedido, error: pedidoError } = await supabase
          .from("loja_pedidos")
          .insert([{
            numero_pedido: numeroPedido,
            vendedor_cliente_id: vendedorId,
            comprador_nome: dados.nome,
            comprador_email: dados.email,
            comprador_telefone: dados.telefone,
            comprador_cpf_cnpj: dados.cpf_cnpj || null,
            endereco_entrega: {
              cep: dados.cep,
              endereco: dados.endereco,
              numero: dados.numero,
              complemento: dados.complemento,
              bairro: dados.bairro,
              cidade: dados.cidade,
              estado: dados.estado,
            },
            subtotal: subtotalVendedor,
            valor_total: subtotalVendedor,
            observacoes: dados.observacoes || null,
            origem: "marketplace",
            status: "pendente",
          }])
          .select()
          .single()

        if (pedidoError) throw pedidoError

        // Create order items
        const itensInsert = vendedor.itens.map((item) => ({
          pedido_id: pedido.id,
          anuncio_id: item.anuncio.id,
          quantidade: item.quantidade,
          preco_unitario: item.anuncio.preco_promocional || item.anuncio.preco_unitario,
          valor_total:
            (item.anuncio.preco_promocional || item.anuncio.preco_unitario) * item.quantidade,
        }))

        const { error: itensError } = await supabase
          .from("loja_pedido_itens")
          .insert(itensInsert)

        if (itensError) throw itensError

        pedidosIds.push(pedido.numero_pedido)
      }

      setPedidosCriados(pedidosIds)
      limparCarrinho()

      toast({
        title: "Pedido(s) criado(s) com sucesso!",
        description: `${pedidosIds.length} pedido(s) enviado(s) para os vendedores.`,
      })
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Erro ao criar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (pedidosCriados.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pedido Confirmado!</h1>
            <p className="text-muted-foreground mb-4">
              Seus pedidos foram enviados para os vendedores.
            </p>
            <div className="space-y-2 mb-6">
              {pedidosCriados.map((numero) => (
                <p key={numero} className="font-mono text-sm bg-muted px-3 py-1 rounded">
                  {numero}
                </p>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Os vendedores entrarão em contato para confirmar o pedido e combinar a entrega.
            </p>
            <Link to="/marketplace">
              <Button className="w-full">Voltar ao Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Carrinho vazio</h1>
        <p className="text-muted-foreground mb-4">Adicione produtos para continuar</p>
        <Link to="/marketplace">
          <Button>Explorar Produtos</Button>
        </Link>
      </div>
    )
  }

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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          to="/marketplace"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Continuar comprando
        </Link>

        <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Form */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados do Comprador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={dados.nome}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={dados.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        value={dados.telefone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                      <Input
                        id="cpf_cnpj"
                        name="cpf_cnpj"
                        value={dados.cpf_cnpj}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        name="cep"
                        value={dados.cep}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        name="endereco"
                        value={dados.endereco}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        name="numero"
                        value={dados.numero}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        name="complemento"
                        value={dados.complemento}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        name="bairro"
                        value={dados.bairro}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        name="cidade"
                        value={dados.cidade}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        name="estado"
                        value={dados.estado}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    name="observacoes"
                    placeholder="Instruções especiais de entrega, horários, etc."
                    value={dados.observacoes}
                    onChange={handleInputChange}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(itensPorVendedor).map(([vendedorId, vendedor]) => (
                    <div key={vendedorId} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Store className="h-4 w-4" />
                        {vendedor.loja?.nome_loja || "Loja"}
                      </div>
                      {vendedor.itens.map((item) => {
                        const preco =
                          item.anuncio.preco_promocional || item.anuncio.preco_unitario
                        return (
                          <div key={item.anuncio.id} className="flex justify-between text-sm">
                            <span className="truncate flex-1">
                              {item.quantidade}x {item.anuncio.titulo}
                            </span>
                            <span className="ml-2">R$ {(preco * item.quantidade).toFixed(2)}</span>
                          </div>
                        )
                      })}
                      <Separator className="my-2" />
                    </div>
                  ))}

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Frete a combinar com vendedor(es)
                  </p>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Confirmar Pedido"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao confirmar, os vendedores receberão seu pedido e entrarão em contato.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
